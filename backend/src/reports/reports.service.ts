import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, OrderStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Convert Prisma Decimal to number
   */
  private toNumber(decimal: Prisma.Decimal | number | null): number {
    if (decimal === null) return 0;
    if (typeof decimal === 'number') return decimal;
    return parseFloat(decimal.toString());
  }

  /**
   * Get general statistics for the restaurant
   * 
   * IMPORTANTE: Receita é calculada apenas com pedidos PAID (pagos),
   * usando o campo paidAt para filtrar por período de pagamento.
   * Isso garante consistência com o Dashboard.
   */
  async getStats(restaurantId: string, period: 'today' | '7days' | '30days' | 'month' | 'lastMonth') {
    const { startDate, endDate, previousStartDate, previousEndDate } = this.getDateRange(period);

    // Current period - pedidos PAGOS no período (baseado em paidAt)
    const currentPaidOrders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        status: OrderStatus.PAID,
        paidAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Previous period - pedidos PAGOS no período anterior
    const previousPaidOrders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        status: OrderStatus.PAID,
        paidAt: {
          gte: previousStartDate,
          lte: previousEndDate,
        },
      },
    });

    // Calculate current period stats (apenas pedidos pagos)
    const totalRevenue = currentPaidOrders.reduce((sum, order) => sum + this.toNumber(order.total), 0);
    const totalOrders = currentPaidOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate previous period stats for comparison
    const prevRevenue = previousPaidOrders.reduce((sum, order) => sum + this.toNumber(order.total), 0);
    const prevOrders = previousPaidOrders.length;
    const prevAvgOrderValue = prevOrders > 0 ? prevRevenue / prevOrders : 0;

    // Calculate percentage changes
    const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const ordersChange = prevOrders > 0 ? ((totalOrders - prevOrders) / prevOrders) * 100 : 0;
    const avgOrderChange = prevAvgOrderValue > 0 ? ((avgOrderValue - prevAvgOrderValue) / prevAvgOrderValue) * 100 : 0;

    // Calculate average prep time (from createdAt to readyAt)
    const avgPrepTime = await this.calculateAvgPrepTime(restaurantId, startDate, endDate);
    const prevAvgPrepTime = await this.calculateAvgPrepTime(restaurantId, previousStartDate, previousEndDate);
    const prepTimeChange = prevAvgPrepTime > 0 ? ((avgPrepTime - prevAvgPrepTime) / prevAvgPrepTime) * 100 : 0;

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      avgPrepTime,
      revenueChange: parseFloat(revenueChange.toFixed(1)),
      ordersChange: parseFloat(ordersChange.toFixed(1)),
      avgOrderChange: parseFloat(avgOrderChange.toFixed(1)),
      prepTimeChange: parseFloat(prepTimeChange.toFixed(1)),
    };
  }

  /**
   * Calculate average preparation time in minutes
   * Time from order creation (createdAt) to ready (readyAt)
   */
  private async calculateAvgPrepTime(
    restaurantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const ordersWithReadyTime = await this.prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        readyAt: {
          not: null, // Only orders that have been marked as ready
        },
        status: {
          not: OrderStatus.CANCELLED,
        },
      },
      select: {
        createdAt: true,
        readyAt: true,
      },
    });

    if (ordersWithReadyTime.length === 0) {
      return 0; // No data to calculate
    }

    // Calculate total prep time in minutes
    const totalPrepTimeMinutes = ordersWithReadyTime.reduce((sum, order) => {
      if (!order.readyAt) return sum;
      const diffMs = order.readyAt.getTime() - order.createdAt.getTime();
      const diffMinutes = diffMs / (1000 * 60); // Convert ms to minutes
      return sum + diffMinutes;
    }, 0);

    const avgMinutes = totalPrepTimeMinutes / ordersWithReadyTime.length;
    return Math.round(avgMinutes); // Return rounded integer
  }

  /**
   * Get daily sales data for charts
   * 
   * Usa paidAt para agrupar por dia de pagamento (consistente com Dashboard)
   */
  async getDailySales(restaurantId: string, period: 'today' | '7days' | '30days' | 'month' | 'lastMonth') {
    const { startDate, endDate } = this.getDateRange(period);

    // Busca pedidos PAGOS no período, baseado na data de pagamento
    const orders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        status: OrderStatus.PAID,
        paidAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        total: true,
        paidAt: true,
      },
      orderBy: {
        paidAt: 'asc',
      },
    });

    // Group by day of payment
    const dailyData: Record<string, { orders: number; revenue: number }> = {};
    const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    orders.forEach((order) => {
      if (!order.paidAt) return;
      const date = order.paidAt.toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { orders: 0, revenue: 0 };
      }
      dailyData[date].orders += 1;
      dailyData[date].revenue += this.toNumber(order.total);
    });

    // Transform to array with day labels
    const result = Object.entries(dailyData).map(([date, data]) => {
      const dayOfWeek = new Date(date + 'T12:00:00').getDay();
      return {
        day: dayLabels[dayOfWeek],
        date,
        orders: data.orders,
        revenue: parseFloat(data.revenue.toFixed(2)),
      };
    });

    return result;
  }

  /**
   * Get top selling items
   * 
   * Considera apenas itens de pedidos PAGOS no período
   */
  async getTopItems(restaurantId: string, period: 'today' | '7days' | '30days' | 'month' | 'lastMonth', limit: number = 100) {
    const { startDate, endDate } = this.getDateRange(period);

    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          restaurantId,
          status: OrderStatus.PAID,
          paidAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      select: {
        name: true,
        quantity: true,
        price: true,
      },
    });

    // Group by item name and calculate totals
    const itemStats: Record<string, { qty: number; revenue: number }> = {};

    orderItems.forEach((item) => {
      const name = item.name;
      if (!itemStats[name]) {
        itemStats[name] = { qty: 0, revenue: 0 };
      }
      itemStats[name].qty += item.quantity;
      itemStats[name].revenue += this.toNumber(item.price);
    });

    // Sort by quantity and get top items
    const topItems = Object.entries(itemStats)
      .map(([name, stats]) => ({
        name,
        qty: stats.qty,
        revenue: parseFloat(stats.revenue.toFixed(2)),
      }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, limit);

    return topItems;
  }

  /**
   * Get complete report data
   */
  async getFullReport(restaurantId: string, period: 'today' | '7days' | '30days' | 'month' | 'lastMonth') {
    const [stats, dailySales, topItems] = await Promise.all([
      this.getStats(restaurantId, period),
      this.getDailySales(restaurantId, period),
      this.getTopItems(restaurantId, period),
    ]);

    return {
      stats,
      dailySales,
      topItems,
    };
  }

  /**
   * Helper to calculate date ranges
   */
  private getDateRange(period: 'today' | '7days' | '30days' | 'month' | 'lastMonth') {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);
    let previousStartDate: Date;
    let previousEndDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 1);
        previousEndDate = new Date(endDate);
        previousEndDate.setDate(previousEndDate.getDate() - 1);
        break;

      case '7days':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 7);
        previousEndDate = new Date(startDate);
        previousEndDate.setDate(previousEndDate.getDate() - 1);
        previousEndDate.setHours(23, 59, 59, 999);
        break;

      case '30days':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
        
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 30);
        previousEndDate = new Date(startDate);
        previousEndDate.setDate(previousEndDate.getDate() - 1);
        previousEndDate.setHours(23, 59, 59, 999);
        break;

      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;

      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        previousEndDate = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);
        break;

      default:
        // Default to 7 days
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 7);
        previousEndDate = new Date(startDate);
        previousEndDate.setDate(previousEndDate.getDate() - 1);
        previousEndDate.setHours(23, 59, 59, 999);
    }

    return { startDate, endDate, previousStartDate, previousEndDate };
  }
}

