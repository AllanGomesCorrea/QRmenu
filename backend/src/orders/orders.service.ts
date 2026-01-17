import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { OrderStatus, OrderItemStatus, TableStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateOrderDto, UpdateOrderStatusDto, UpdateOrderItemStatusDto } from './dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * Convert Prisma Decimal to number
   */
  private toNumber(decimal: Prisma.Decimal | number): number {
    if (typeof decimal === 'number') return decimal;
    return parseFloat(decimal.toString());
  }

  /**
   * Create a new order from customer session
   */
  async createFromSession(
    sessionId: string,
    dto: CreateOrderDto,
  ) {
    // Validate session
    const session = await this.prisma.tableSession.findUnique({
      where: { id: sessionId },
      include: {
        table: {
          include: { restaurant: true },
        },
      },
    });

    if (!session || !session.isActive || !session.isVerified) {
      throw new ForbiddenException('Sessão inválida ou expirada');
    }

    // Validate menu items exist and are available
    const menuItemIds = dto.items.map((item) => item.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        restaurantId: session.table.restaurantId,
        isAvailable: true,
      },
      include: { extras: true },
    });

    if (menuItems.length !== menuItemIds.length) {
      throw new BadRequestException('Um ou mais itens não estão disponíveis');
    }

    // Create map for quick lookup
    const menuItemMap = new Map(menuItems.map((item) => [item.id, item]));

    // Calculate order items with prices
    let subtotal = 0;
    const orderItemsData = dto.items.map((item) => {
      const menuItem = menuItemMap.get(item.menuItemId)!;
      const menuItemPrice = this.toNumber(menuItem.price);
      let itemPrice = menuItemPrice * item.quantity;

      // Calculate extras price
      const selectedExtras: { name: string; price: number }[] = [];
      if (item.extras && item.extras.length > 0) {
        for (const extra of item.extras) {
          const menuExtra = menuItem.extras.find((e) => e.id === extra.extraId);
          if (menuExtra) {
            const extraPrice = this.toNumber(menuExtra.price);
            itemPrice += extraPrice * item.quantity;
            selectedExtras.push({
              name: menuExtra.name,
              price: extraPrice,
            });
          }
        }
      }

      subtotal += itemPrice;

      return {
        menuItemId: item.menuItemId,
        name: menuItem.name,
        quantity: item.quantity,
        price: itemPrice, // Total price for this item (quantity * (unit + extras))
        notes: item.notes,
        extras: selectedExtras,
      };
    });

    // Generate order number (sequential per restaurant per day)
    const orderNumber = await this.generateOrderNumber(session.table.restaurantId);

    // Create order with items
    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        status: OrderStatus.PENDING,
        subtotal,
        discount: 0,
        total: subtotal,
        notes: dto.notes,
        restaurantId: session.table.restaurantId,
        tableId: session.tableId,
        sessionId,
        items: {
          create: orderItemsData.map((item) => ({
            menuItemId: item.menuItemId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes,
            extras: item.extras,
            status: OrderItemStatus.PENDING,
          })),
        },
        logs: {
          create: {
            action: 'CREATED',
            details: { source: 'customer', sessionId },
          },
        },
      },
      include: {
        items: true,
        table: true,
      },
    });

    // Update table status to OCCUPIED if not already
    if (session.table.status === TableStatus.ACTIVE) {
      await this.prisma.table.update({
        where: { id: session.tableId },
        data: { status: TableStatus.OCCUPIED },
      });
    }

    // Publish event for real-time notifications
    await this.publishOrderEvent('order:created', {
      restaurantId: session.table.restaurantId,
      order,
    });

    return order;
  }

  /**
   * Get orders for kitchen view
   */
  async getKitchenOrders(restaurantId: string) {
    return this.prisma.order.findMany({
      where: {
        restaurantId,
        status: {
          in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY],
        },
      },
      include: {
        items: {
          where: {
            status: { not: OrderItemStatus.DELIVERED },
          },
        },
        table: {
          select: { id: true, number: true, name: true },
        },
        session: {
          select: { customerName: true, customerPhone: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get orders for a specific table session
   */
  async getSessionOrders(sessionId: string) {
    return this.prisma.order.findMany({
      where: { sessionId },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all orders for restaurant (admin)
   */
  async getRestaurantOrders(
    restaurantId: string,
    options?: {
      status?: OrderStatus;
      startDate?: Date;
      endDate?: Date;
      tableId?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const where: any = { restaurantId };

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.tableId) {
      where.tableId = options.tableId;
    }

    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) {
        where.createdAt.gte = options.startDate;
      }
      if (options.endDate) {
        where.createdAt.lte = options.endDate;
      }
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: true,
          table: { select: { id: true, number: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { orders, total };
  }

  /**
   * Get single order by ID
   */
  async getOrderById(orderId: string, restaurantId?: string) {
    const where: any = { id: orderId };
    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    const order = await this.prisma.order.findFirst({
      where,
      include: {
        items: true,
        table: true,
        logs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    return order;
  }

  /**
   * Update order status (staff only)
   */
  async updateOrderStatus(
    orderId: string,
    restaurantId: string,
    dto: UpdateOrderStatusDto,
    userId: string,
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, restaurantId },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // Validate status transition
    this.validateStatusTransition(order.status, dto.status);

    // Update order
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: dto.status,
        logs: {
          create: {
            action: `STATUS_CHANGED`,
            details: {
              from: order.status,
              to: dto.status,
              reason: dto.reason,
              userId,
            },
          },
        },
      },
      include: {
        items: true,
        table: true,
      },
    });

    // If order is ready, all items should be ready
    if (dto.status === OrderStatus.READY) {
      await this.prisma.orderItem.updateMany({
        where: { orderId, status: { not: OrderItemStatus.DELIVERED } },
        data: { status: OrderItemStatus.READY },
      });
    }

    // Publish event
    await this.publishOrderEvent('order:updated', {
      restaurantId,
      order: updatedOrder,
      previousStatus: order.status,
    });

    return updatedOrder;
  }

  /**
   * Update order item status
   */
  async updateItemStatus(
    orderId: string,
    itemId: string,
    restaurantId: string,
    dto: UpdateOrderItemStatusDto,
    userId: string,
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, restaurantId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    const item = order.items.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException('Item não encontrado');
    }

    // Update item status
    const updatedItem = await this.prisma.orderItem.update({
      where: { id: itemId },
      data: { status: dto.status },
    });

    // Log the change
    await this.prisma.orderLog.create({
      data: {
        orderId,
        action: 'ITEM_STATUS_CHANGED',
        details: {
          itemId,
          from: item.status,
          to: dto.status,
          userId,
        },
      },
    });

    // Check if all items are ready/delivered to update order status
    const allItems = await this.prisma.orderItem.findMany({
      where: { orderId },
    });

    const allReady = allItems.every(
      (i) => i.status === OrderItemStatus.READY || i.status === OrderItemStatus.DELIVERED,
    );
    const allDelivered = allItems.every((i) => i.status === OrderItemStatus.DELIVERED);

    if (allDelivered && order.status !== OrderStatus.DELIVERED) {
      await this.updateOrderStatus(
        orderId,
        restaurantId,
        { status: OrderStatus.DELIVERED },
        userId,
      );
    } else if (allReady && order.status === OrderStatus.PREPARING) {
      await this.updateOrderStatus(
        orderId,
        restaurantId,
        { status: OrderStatus.READY },
        userId,
      );
    }

    // Publish event
    await this.publishOrderEvent('order:item:updated', {
      restaurantId,
      orderId,
      item: updatedItem,
    });

    return updatedItem;
  }

  /**
   * Cancel order
   */
  async cancelOrder(
    orderId: string,
    restaurantId: string,
    reason: string,
    userId: string,
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, restaurantId },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Não é possível cancelar este pedido');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        logs: {
          create: {
            action: 'CANCELLED',
            details: { reason, userId },
          },
        },
      },
      include: {
        items: true,
        table: true,
      },
    });

    // Publish event
    await this.publishOrderEvent('order:cancelled', {
      restaurantId,
      order: updatedOrder,
      reason,
    });

    return updatedOrder;
  }

  /**
   * Get order statistics for dashboard
   */
  async getOrderStats(restaurantId: string, startDate?: Date, endDate?: Date) {
    const where: any = { restaurantId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [
      totalOrders,
      pendingOrders,
      preparingOrders,
      completedOrders,
      cancelledOrders,
      revenue,
    ] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.PREPARING } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.DELIVERED } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.CANCELLED } }),
      this.prisma.order.aggregate({
        where: { ...where, status: OrderStatus.DELIVERED },
        _sum: { total: true },
      }),
    ]);

    return {
      totalOrders,
      pendingOrders,
      preparingOrders,
      completedOrders,
      cancelledOrders,
      revenue: revenue._sum?.total ? this.toNumber(revenue._sum.total) : 0,
    };
  }

  /**
   * Generate sequential order number for the day
   */
  private async generateOrderNumber(restaurantId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastOrder = await this.prisma.order.findFirst({
      where: {
        restaurantId,
        createdAt: { gte: today },
      },
      orderBy: { orderNumber: 'desc' },
    });

    return (lastOrder?.orderNumber || 0) + 1;
  }

  /**
   * Validate order status transitions
   */
  private validateStatusTransition(current: OrderStatus, next: OrderStatus) {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      // PENDING pode ir direto para PREPARING (Aceitar e Preparar) ou para CONFIRMED, ou ser cancelado
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.CANCELLED],
      // CONFIRMED pode ir para PREPARING ou ser cancelado
      [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      // PREPARING pode ir direto para DELIVERED (Pronto!) ou para READY, ou ser cancelado
      [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      // READY pode ir para DELIVERED
      [OrderStatus.READY]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (!validTransitions[current].includes(next)) {
      throw new BadRequestException(
        `Não é possível alterar status de ${current} para ${next}`,
      );
    }
  }

  /**
   * Publish order event to Redis for real-time notifications
   */
  private async publishOrderEvent(event: string, data: any) {
    await this.redis.publish(
      `restaurant:${data.restaurantId}`,
      JSON.stringify({
        event,
        data,
        timestamp: new Date().toISOString(),
      }),
    );
  }
}
