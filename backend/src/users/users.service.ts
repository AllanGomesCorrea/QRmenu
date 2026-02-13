import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(restaurantId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { restaurantId },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where: { restaurantId } }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, restaurantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, restaurantId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async create(restaurantId: string, dto: CreateUserDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    // Prevent creating SUPER_ADMIN or ADMIN via this endpoint
    if (dto.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Não é permitido criar Super Admin');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        ...dto,
        password: hashedPassword,
        restaurantId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return user;
  }

  async update(id: string, restaurantId: string, dto: UpdateUserDto) {
    // Verify user exists and belongs to restaurant
    const existing = await this.prisma.user.findFirst({
      where: { id, restaurantId },
    });

    if (!existing) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Prevent changing to SUPER_ADMIN
    if (dto.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Não é permitido atribuir role de Super Admin');
    }

    // Check email uniqueness if being updated
    if (dto.email && dto.email !== existing.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (emailExists) {
        throw new ConflictException('Email já cadastrado');
      }
    }

    // Hash password if being updated
    const updateData: any = { ...dto };
    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async delete(id: string, restaurantId: string, currentUserId: string) {
    // Verify user exists and belongs to restaurant
    const existing = await this.prisma.user.findFirst({
      where: { id, restaurantId },
    });

    if (!existing) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Prevent self-deletion
    if (id === currentUserId) {
      throw new ForbiddenException('Não é permitido deletar a própria conta');
    }

    // Soft delete (deactivate)
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Usuário desativado com sucesso' };
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }
}

