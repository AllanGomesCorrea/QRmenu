import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class MenuService {
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * Get full menu for a restaurant (public endpoint)
   */
  async getMenuBySlug(slug: string) {
    // Try to get from cache first
    const cacheKey = `menu:${slug}`;
    const cached = await this.redis.getJson<any>(cacheKey);

    if (cached) {
      return cached;
    }

    // Get restaurant
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        bannerUrl: true,
        phone: true,
        whatsapp: true,
        address: true,
        city: true,
        state: true,
        settings: true,
        isActive: true,
      },
    });

    if (!restaurant || !restaurant.isActive) {
      throw new NotFoundException('Restaurante não encontrado');
    }

    // Get categories with items
    const categories = await this.prisma.menuCategory.findMany({
      where: {
        restaurantId: restaurant.id,
        isActive: true,
      },
      include: {
        items: {
          where: { isAvailable: true },
          include: { extras: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Get featured items
    const featuredItems = await this.prisma.menuItem.findMany({
      where: {
        restaurantId: restaurant.id,
        isAvailable: true,
        isFeatured: true,
      },
      include: {
        category: { select: { id: true, name: true } },
        extras: true,
      },
      take: 10,
    });

    const result = {
      restaurant,
      categories,
      featuredItems,
    };

    // Cache result
    await this.redis.setJson(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  /**
   * Get single item details (public endpoint)
   */
  async getItemBySlugAndId(slug: string, itemId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug },
      select: { id: true, isActive: true },
    });

    if (!restaurant || !restaurant.isActive) {
      throw new NotFoundException('Restaurante não encontrado');
    }

    const item = await this.prisma.menuItem.findFirst({
      where: {
        id: itemId,
        restaurantId: restaurant.id,
        isAvailable: true,
      },
      include: {
        category: { select: { id: true, name: true } },
        extras: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Item não encontrado');
    }

    return item;
  }

  /**
   * Search items in a restaurant's menu
   */
  async searchItems(slug: string, query: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug },
      select: { id: true, isActive: true },
    });

    if (!restaurant || !restaurant.isActive) {
      throw new NotFoundException('Restaurante não encontrado');
    }

    const items = await this.prisma.menuItem.findMany({
      where: {
        restaurantId: restaurant.id,
        isAvailable: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        category: { select: { id: true, name: true } },
        extras: true,
      },
      take: 20,
    });

    return items;
  }

  /**
   * Get items by dietary filter
   */
  async getItemsByFilter(
    slug: string,
    filters: {
      isVegan?: boolean;
      isVegetarian?: boolean;
      isGlutenFree?: boolean;
      isSpicy?: boolean;
    },
  ) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug },
      select: { id: true, isActive: true },
    });

    if (!restaurant || !restaurant.isActive) {
      throw new NotFoundException('Restaurante não encontrado');
    }

    const where: any = {
      restaurantId: restaurant.id,
      isAvailable: true,
    };

    if (filters.isVegan !== undefined) where.isVegan = filters.isVegan;
    if (filters.isVegetarian !== undefined) where.isVegetarian = filters.isVegetarian;
    if (filters.isGlutenFree !== undefined) where.isGlutenFree = filters.isGlutenFree;
    if (filters.isSpicy !== undefined) where.isSpicy = filters.isSpicy;

    const items = await this.prisma.menuItem.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        extras: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    return items;
  }

  /**
   * Invalidate menu cache for a restaurant
   */
  async invalidateCache(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { slug: true },
    });

    if (restaurant) {
      await this.redis.del(`menu:${restaurant.slug}`);
    }
  }
}

