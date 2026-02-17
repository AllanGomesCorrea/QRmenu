import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateRestaurantDto } from './dto';

@Injectable()
export class RestaurantsService {
  constructor(private prisma: PrismaService) {}

  async findBySlug(slug: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        bannerUrl: true,
        address: true,
        city: true,
        state: true,
        phone: true,
        whatsapp: true,
        settings: true,
        isActive: true,
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante não encontrado');
    }

    if (!restaurant.isActive) {
      throw new NotFoundException('Restaurante não está disponível');
    }

    return restaurant;
  }

  async findById(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante não encontrado');
    }

    return restaurant;
  }

  async findMine(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        _count: {
          select: {
            users: true,
            tables: true,
            menuItems: true,
            orders: true,
          },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante não encontrado');
    }

    return restaurant;
  }

  async update(restaurantId: string, dto: UpdateRestaurantDto) {
    // Verify restaurant exists
    const existing = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!existing) {
      throw new NotFoundException('Restaurante não encontrado');
    }

    // Build update data, converting settings if present
    const updateData: any = { ...dto };
    if (dto.settings) {
      updateData.settings = dto.settings;
    }

    const updated = await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: updateData,
    });

    return updated;
  }

  async findAll(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { city: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [restaurants, total] = await Promise.all([
      this.prisma.restaurant.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          city: true,
          state: true,
          isActive: true,
          plan: true,
          createdAt: true,
          _count: {
            select: {
              users: true,
              tables: true,
              orders: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.restaurant.count({ where }),
    ]);

    return {
      data: restaurants,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllPublic(page = 1, limit = 20, search?: string, city?: string) {
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ];
    }
    
    if (city) {
      where.city = { contains: city, mode: 'insensitive' as const };
    }

    const [restaurants, total] = await Promise.all([
      this.prisma.restaurant.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logoUrl: true,
          bannerUrl: true,
          address: true,
          city: true,
          state: true,
          phone: true,
          _count: {
            select: {
              menuItems: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.restaurant.count({ where }),
    ]);

    return {
      data: restaurants,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStats(restaurantId: string) {
    const [
      totalOrders,
      todayOrders,
      activeTables,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.order.count({
        where: { restaurantId },
      }),
      this.prisma.order.count({
        where: {
          restaurantId,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.prisma.table.count({
        where: {
          restaurantId,
          status: { in: ['ACTIVE', 'OCCUPIED'] },
        },
      }),
      this.prisma.order.aggregate({
        where: {
          restaurantId,
          status: { in: ['PAID'] },
        },
        _sum: { total: true },
      }),
    ]);

    return {
      totalOrders,
      todayOrders,
      activeTables,
      totalRevenue: totalRevenue._sum.total || 0,
    };
  }
}

