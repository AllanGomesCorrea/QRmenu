import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(restaurantId: string) {
    return this.prisma.menuCategory.findMany({
      where: { restaurantId },
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(id: string, restaurantId: string) {
    const category = await this.prisma.menuCategory.findFirst({
      where: { id, restaurantId },
      include: {
        items: {
          where: { isAvailable: true },
          include: { extras: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    return category;
  }

  async create(restaurantId: string, dto: CreateCategoryDto) {
    // Check for duplicate name
    const existing = await this.prisma.menuCategory.findFirst({
      where: {
        restaurantId,
        name: { equals: dto.name, mode: 'insensitive' },
      },
    });

    if (existing) {
      throw new ConflictException('Já existe uma categoria com este nome');
    }

    // Get next sortOrder if not provided
    if (dto.sortOrder === undefined) {
      const lastCategory = await this.prisma.menuCategory.findFirst({
        where: { restaurantId },
        orderBy: { sortOrder: 'desc' },
      });
      dto.sortOrder = (lastCategory?.sortOrder || 0) + 1;
    }

    return this.prisma.menuCategory.create({
      data: {
        ...dto,
        restaurantId,
      },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });
  }

  async update(id: string, restaurantId: string, dto: UpdateCategoryDto) {
    // Verify category exists
    const existing = await this.prisma.menuCategory.findFirst({
      where: { id, restaurantId },
    });

    if (!existing) {
      throw new NotFoundException('Categoria não encontrada');
    }

    // Check for duplicate name if updating name
    if (dto.name && dto.name !== existing.name) {
      const duplicate = await this.prisma.menuCategory.findFirst({
        where: {
          restaurantId,
          name: { equals: dto.name, mode: 'insensitive' },
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new ConflictException('Já existe uma categoria com este nome');
      }
    }

    return this.prisma.menuCategory.update({
      where: { id },
      data: dto,
      include: {
        _count: {
          select: { items: true },
        },
      },
    });
  }

  async delete(id: string, restaurantId: string) {
    // Verify category exists
    const existing = await this.prisma.menuCategory.findFirst({
      where: { id, restaurantId },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Categoria não encontrada');
    }

    // Check if category has items
    if (existing._count.items > 0) {
      throw new ConflictException(
        'Não é possível excluir categoria com itens. Remova os itens primeiro.',
      );
    }

    await this.prisma.menuCategory.delete({
      where: { id },
    });

    return { message: 'Categoria excluída com sucesso' };
  }

  async reorder(restaurantId: string, categoryIds: string[]) {
    // Update sortOrder for each category
    await this.prisma.$transaction(
      categoryIds.map((id, index) =>
        this.prisma.menuCategory.updateMany({
          where: { id, restaurantId },
          data: { sortOrder: index },
        }),
      ),
    );

    return this.findAll(restaurantId);
  }
}

