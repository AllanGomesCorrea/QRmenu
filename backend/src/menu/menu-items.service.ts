import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuItemDto, UpdateMenuItemDto } from './dto';

@Injectable()
export class MenuItemsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    restaurantId: string,
    options?: {
      categoryId?: string;
      search?: string;
      availableOnly?: boolean;
      featuredOnly?: boolean;
    },
  ) {
    const where: any = { restaurantId };

    if (options?.categoryId) {
      where.categoryId = options.categoryId;
    }

    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    if (options?.availableOnly) {
      where.isAvailable = true;
    }

    if (options?.featuredOnly) {
      where.isFeatured = true;
    }

    return this.prisma.menuItem.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true },
        },
        extras: true,
      },
      orderBy: [
        { category: { sortOrder: 'asc' } },
        { sortOrder: 'asc' },
      ],
    });
  }

  async findById(id: string, restaurantId: string) {
    const item = await this.prisma.menuItem.findFirst({
      where: { id, restaurantId },
      include: {
        category: {
          select: { id: true, name: true },
        },
        extras: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Item não encontrado');
    }

    return item;
  }

  async create(restaurantId: string, dto: CreateMenuItemDto) {
    const { extras, ...itemData } = dto;

    // Verify category exists and belongs to restaurant
    const category = await this.prisma.menuCategory.findFirst({
      where: { id: dto.categoryId, restaurantId },
    });

    if (!category) {
      throw new BadRequestException('Categoria não encontrada');
    }

    // Get next sortOrder if not provided
    if (itemData.sortOrder === undefined) {
      const lastItem = await this.prisma.menuItem.findFirst({
        where: { categoryId: dto.categoryId },
        orderBy: { sortOrder: 'desc' },
      });
      itemData.sortOrder = (lastItem?.sortOrder || 0) + 1;
    }

    return this.prisma.menuItem.create({
      data: {
        ...itemData,
        restaurantId,
        extras: extras?.length
          ? {
              create: extras.map((extra) => ({
                name: extra.name,
                price: extra.price,
                isRequired: extra.isRequired || false,
              })),
            }
          : undefined,
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
        extras: true,
      },
    });
  }

  async update(id: string, restaurantId: string, dto: UpdateMenuItemDto) {
    const { extras, ...itemData } = dto;

    // Verify item exists
    const existing = await this.prisma.menuItem.findFirst({
      where: { id, restaurantId },
      include: { extras: true },
    });

    if (!existing) {
      throw new NotFoundException('Item não encontrado');
    }

    // Verify category if changing
    if (dto.categoryId && dto.categoryId !== existing.categoryId) {
      const category = await this.prisma.menuCategory.findFirst({
        where: { id: dto.categoryId, restaurantId },
      });

      if (!category) {
        throw new BadRequestException('Categoria não encontrada');
      }
    }

    // Handle extras update
    if (extras !== undefined) {
      // Delete existing extras
      await this.prisma.menuItemExtra.deleteMany({
        where: { menuItemId: id },
      });

      // Create new extras
      if (extras.length > 0) {
        await this.prisma.menuItemExtra.createMany({
          data: extras.map((extra) => ({
            menuItemId: id,
            name: extra.name!,
            price: extra.price!,
            isRequired: extra.isRequired || false,
          })),
        });
      }
    }

    return this.prisma.menuItem.update({
      where: { id },
      data: itemData,
      include: {
        category: {
          select: { id: true, name: true },
        },
        extras: true,
      },
    });
  }

  async delete(id: string, restaurantId: string) {
    // Verify item exists
    const existing = await this.prisma.menuItem.findFirst({
      where: { id, restaurantId },
    });

    if (!existing) {
      throw new NotFoundException('Item não encontrado');
    }

    // Delete item (extras will cascade)
    await this.prisma.menuItem.delete({
      where: { id },
    });

    return { message: 'Item excluído com sucesso' };
  }

  async toggleAvailability(id: string, restaurantId: string) {
    const existing = await this.prisma.menuItem.findFirst({
      where: { id, restaurantId },
    });

    if (!existing) {
      throw new NotFoundException('Item não encontrado');
    }

    return this.prisma.menuItem.update({
      where: { id },
      data: { isAvailable: !existing.isAvailable },
      include: {
        category: {
          select: { id: true, name: true },
        },
        extras: true,
      },
    });
  }

  async toggleFeatured(id: string, restaurantId: string) {
    const existing = await this.prisma.menuItem.findFirst({
      where: { id, restaurantId },
    });

    if (!existing) {
      throw new NotFoundException('Item não encontrado');
    }

    return this.prisma.menuItem.update({
      where: { id },
      data: { isFeatured: !existing.isFeatured },
      include: {
        category: {
          select: { id: true, name: true },
        },
        extras: true,
      },
    });
  }

  async reorder(restaurantId: string, categoryId: string, itemIds: string[]) {
    // Verify category belongs to restaurant
    const category = await this.prisma.menuCategory.findFirst({
      where: { id: categoryId, restaurantId },
    });

    if (!category) {
      throw new BadRequestException('Categoria não encontrada');
    }

    // Update sortOrder for each item
    await this.prisma.$transaction(
      itemIds.map((id, index) =>
        this.prisma.menuItem.updateMany({
          where: { id, restaurantId, categoryId },
          data: { sortOrder: index },
        }),
      ),
    );

    return this.findAll(restaurantId, { categoryId });
  }
}

