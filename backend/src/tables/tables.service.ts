import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { TableStatus, OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QRCodeService } from './qrcode.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { CreateTableDto, UpdateTableDto } from './dto';

@Injectable()
export class TablesService {
  constructor(
    private prisma: PrismaService,
    private qrCodeService: QRCodeService,
    @Inject(forwardRef(() => WebsocketGateway))
    private websocketGateway: WebsocketGateway,
  ) {}

  async findAll(restaurantId: string) {
    return this.prisma.table.findMany({
      where: { restaurantId },
      include: {
        _count: {
          select: { sessions: { where: { isActive: true } } },
        },
      },
      orderBy: [{ section: 'asc' }, { number: 'asc' }],
    });
  }

  async findById(id: string, restaurantId: string) {
    const table = await this.prisma.table.findFirst({
      where: { id, restaurantId },
      include: {
        sessions: {
          where: { isActive: true },
          select: {
            id: true,
            customerName: true,
            customerPhone: true,
            createdAt: true,
          },
        },
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!table) {
      throw new NotFoundException('Mesa não encontrada');
    }

    return table;
  }

  async findByQRCode(qrCode: string) {
    const table = await this.prisma.table.findUnique({
      where: { qrCode },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            isActive: true,
          },
        },
      },
    });

    if (!table) {
      throw new NotFoundException('Mesa não encontrada');
    }

    if (!table.restaurant.isActive) {
      throw new BadRequestException('Restaurante não está disponível');
    }

    return table;
  }

  async create(restaurantId: string, dto: CreateTableDto) {
    // Check for duplicate table number
    const existing = await this.prisma.table.findFirst({
      where: { restaurantId, number: dto.number },
    });

    if (existing) {
      throw new ConflictException('Já existe uma mesa com este número');
    }

    // Get restaurant slug for QR code
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { slug: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante não encontrado');
    }

    // Generate unique QR code
    const qrCode = this.qrCodeService.generateQRCodeId(restaurant.slug, dto.number);
    const qrCodeUrl = this.qrCodeService.generateTableUrl(restaurant.slug, qrCode);

    return this.prisma.table.create({
      data: {
        ...dto,
        qrCode,
        qrCodeUrl,
        restaurantId,
      },
    });
  }

  async createBulk(restaurantId: string, count: number, section?: string) {
    // Get restaurant slug
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { slug: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante não encontrado');
    }

    // Get highest table number
    const lastTable = await this.prisma.table.findFirst({
      where: { restaurantId },
      orderBy: { number: 'desc' },
    });

    const startNumber = (lastTable?.number || 0) + 1;
    const tables = [];

    for (let i = 0; i < count; i++) {
      const number = startNumber + i;
      const qrCode = this.qrCodeService.generateQRCodeId(restaurant.slug, number);
      const qrCodeUrl = this.qrCodeService.generateTableUrl(restaurant.slug, qrCode);

      tables.push({
        number,
        qrCode,
        qrCodeUrl,
        section,
        restaurantId,
      });
    }

    await this.prisma.table.createMany({ data: tables });

    return this.findAll(restaurantId);
  }

  async update(id: string, restaurantId: string, dto: UpdateTableDto) {
    // Verify table exists
    const existing = await this.prisma.table.findFirst({
      where: { id, restaurantId },
    });

    if (!existing) {
      throw new NotFoundException('Mesa não encontrada');
    }

    return this.prisma.table.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string, restaurantId: string) {
    // Verify table exists
    const existing = await this.prisma.table.findFirst({
      where: { id, restaurantId },
      include: {
        _count: {
          select: { orders: true, sessions: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Mesa não encontrada');
    }

    // Check for active sessions or orders
    if (existing._count.sessions > 0 || existing._count.orders > 0) {
      throw new ConflictException(
        'Não é possível excluir mesa com sessões ou pedidos',
      );
    }

    await this.prisma.table.delete({
      where: { id },
    });

    return { message: 'Mesa excluída com sucesso' };
  }

  async activateTable(id: string, restaurantId: string) {
    const table = await this.prisma.table.findFirst({
      where: { id, restaurantId },
    });

    if (!table) {
      throw new NotFoundException('Mesa não encontrada');
    }

    if (table.status !== TableStatus.INACTIVE && table.status !== TableStatus.CLOSED) {
      throw new BadRequestException('Mesa já está ativa');
    }

    return this.prisma.table.update({
      where: { id },
      data: { status: TableStatus.ACTIVE },
    });
  }

  async closeTable(id: string, restaurantId: string) {
    const table = await this.prisma.table.findFirst({
      where: { id, restaurantId },
      include: {
        sessions: { where: { isActive: true } },
      },
    });

    if (!table) {
      throw new NotFoundException('Mesa não encontrada');
    }

    // Deactivate all sessions
    await this.prisma.tableSession.updateMany({
      where: { tableId: id, isActive: true },
      data: { isActive: false },
    });

    return this.prisma.table.update({
      where: { id },
      data: { status: TableStatus.CLOSED },
    });
  }

  /**
   * Release table after payment - sets status to ACTIVE (available)
   * Only allows release if all active orders are READY or CANCELLED
   * Marks all READY orders as PAID
   */
  async releaseTable(id: string, restaurantId: string) {
    const table = await this.prisma.table.findFirst({
      where: { id, restaurantId },
      include: {
        sessions: { where: { isActive: true } },
      },
    });

    if (!table) {
      throw new NotFoundException('Mesa não encontrada');
    }

    // Check if there are any orders that are not READY, PAID, or CANCELLED
    const pendingOrders = await this.prisma.order.findMany({
      where: {
        tableId: id,
        restaurantId,
        status: {
          in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING],
        },
      },
      select: { orderNumber: true, status: true },
    });

    if (pendingOrders.length > 0) {
      const orderNumbers = pendingOrders.map(o => `#${String(o.orderNumber).padStart(4, '0')}`).join(', ');
      throw new BadRequestException(
        `Não é possível fechar a conta. Os seguintes pedidos ainda não foram entregues: ${orderNumbers}. ` +
        `Aguarde todos os pedidos ficarem prontos antes de fechar a conta.`
      );
    }

    // Mark all READY orders as PAID
    await this.prisma.order.updateMany({
      where: {
        tableId: id,
        restaurantId,
        status: OrderStatus.READY,
      },
      data: { 
        status: OrderStatus.PAID,
        paidAt: new Date(),
      },
    });

    // Get active session IDs before deactivating (to notify via WebSocket)
    const activeSessions = await this.prisma.tableSession.findMany({
      where: { tableId: id, isActive: true },
      select: { id: true },
    });

    // Deactivate all active sessions
    await this.prisma.tableSession.updateMany({
      where: { tableId: id, isActive: true },
      data: { isActive: false },
    });

    // Notify ALL clients on this table that session was closed
    // Using table room ensures every customer on the table gets the notification
    this.websocketGateway.server
      .to(`table:${id}`)
      .emit('session:closed', {
        tableId: id,
        tableNumber: table.number,
        tableName: table.name,
        reason: 'payment_completed',
        message: 'Conta paga! Obrigado pela visita.',
        timestamp: new Date().toISOString(),
      });
    
    // Also emit to individual session rooms as fallback
    for (const session of activeSessions) {
      this.websocketGateway.server
        .to(`session:${session.id}`)
        .emit('session:closed', {
          sessionId: session.id,
          tableId: id,
          tableNumber: table.number,
          tableName: table.name,
          reason: 'payment_completed',
          message: 'Conta paga! Obrigado pela visita.',
          timestamp: new Date().toISOString(),
        });
    }

    // Set table status to ACTIVE (available for new customers)
    return this.prisma.table.update({
      where: { id },
      data: { status: TableStatus.ACTIVE },
    });
  }

  async getQRCode(id: string, restaurantId: string, format: 'dataurl' | 'svg' = 'dataurl') {
    const table = await this.prisma.table.findFirst({
      where: { id, restaurantId },
    });

    if (!table) {
      throw new NotFoundException('Mesa não encontrada');
    }

    if (!table.qrCodeUrl) {
      throw new BadRequestException('QR Code não disponível');
    }

    if (format === 'svg') {
      return {
        qrCode: table.qrCode,
        svg: await this.qrCodeService.generateQRCodeSvg(table.qrCodeUrl),
      };
    }

    return {
      qrCode: table.qrCode,
      dataUrl: await this.qrCodeService.generateQRCodeDataUrl(table.qrCodeUrl),
    };
  }

  async regenerateQRCode(id: string, restaurantId: string) {
    const table = await this.prisma.table.findFirst({
      where: { id, restaurantId },
    });

    if (!table) {
      throw new NotFoundException('Mesa não encontrada');
    }

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { slug: true },
    });

    const qrCode = this.qrCodeService.generateQRCodeId(restaurant!.slug, table.number);
    const qrCodeUrl = this.qrCodeService.generateTableUrl(restaurant!.slug, qrCode);

    return this.prisma.table.update({
      where: { id },
      data: { qrCode, qrCodeUrl },
    });
  }

  async getTablesByStatus(restaurantId: string, status: TableStatus) {
    return this.prisma.table.findMany({
      where: { restaurantId, status },
      orderBy: { number: 'asc' },
    });
  }

  async getTableStats(restaurantId: string) {
    const [total, active, occupied, billRequested] = await Promise.all([
      this.prisma.table.count({ where: { restaurantId } }),
      this.prisma.table.count({ where: { restaurantId, status: TableStatus.ACTIVE } }),
      this.prisma.table.count({ where: { restaurantId, status: TableStatus.OCCUPIED } }),
      this.prisma.table.count({ where: { restaurantId, status: TableStatus.BILL_REQUESTED } }),
    ]);

    return {
      total,
      active,
      occupied,
      billRequested,
      available: active,
      inactive: total - active - occupied - billRequested,
    };
  }
}

