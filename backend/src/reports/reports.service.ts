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
   */
  async getStats(restaurantId: string, period: 'today' | '7days' | '30days' | 'month' | 'lastMonth') {
    const { startDate, endDate, previousStartDate, previousEndDate } = this.getDateRange(period);

    // Current period orders
    const currentOrders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          not: OrderStatus.CANCELLED,
        },
      },
      include: {
        items: true,
      },
    });

    // Previous period orders for comparison
    const previousOrders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: {
          gte: previousStartDate,
          lte: previousEndDate,
        },
        status: {
          not: OrderStatus.CANCELLED,
        },
      },
    });

    // Calculate current period stats
    const totalRevenue = currentOrders.reduce((sum, order) => sum + this.toNumber(order.total), 0);
    const totalOrders = currentOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate previous period stats for comparison
    const prevRevenue = previousOrders.reduce((sum, order) => sum + this.toNumber(order.total), 0);
    const prevOrders = previousOrders.length;
    const prevAvgOrderValue = prevOrders > 0 ? prevRevenue / prevOrders : 0;

    // Calculate percentage changes
    const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const ordersChange = prevOrders > 0 ? ((totalOrders - prevOrders) / prevOrders) * 100 : 0;
    const avgOrderChange = prevAvgOrderValue > 0 ? ((avgOrderValue - prevAvgOrderValue) / prevAvgOrderValue) * 100 : 0;

    // Calculate average prep time (mock for now, would need timestamps in real scenario)
    const avgPrepTime = 18; // minutes

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      avgPrepTime,
      revenueChange: parseFloat(revenueChange.toFixed(1)),
      ordersChange: parseFloat(ordersChange.toFixed(1)),
      avgOrderChange: parseFloat(avgOrderChange.toFixed(1)),
    };
  }

  /**
   * Get daily sales data for charts
   */
  async getDailySales(restaurantId: string, period: 'today' | '7days' | '30days' | 'month' | 'lastMonth') {
    const { startDate, endDate } = this.getDateRange(period);

    const orders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          not: OrderStatus.CANCELLED,
        },
      },
      select: {
        total: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by day
    const dailyData: Record<string, { orders: number; revenue: number }> = {};
    const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split('T')[0];
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
   */
  async getTopItems(restaurantId: string, period: 'today' | '7days' | '30days' | 'month' | 'lastMonth', limit: number = 5) {
    const { startDate, endDate } = this.getDateRange(period);

    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          restaurantId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            not: OrderStatus.CANCELLED,
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

