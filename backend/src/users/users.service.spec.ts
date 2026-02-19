import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

describe('UsersService', () => {
  let service: UsersService;

  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const users = [
        { id: 'u1', name: 'User 1', role: UserRole.ADMIN },
        { id: 'u2', name: 'User 2', role: UserRole.KITCHEN },
      ];
      mockPrismaService.user.findMany.mockResolvedValue(users);
      mockPrismaService.user.count.mockResolvedValue(2);

      const result = await service.findAll('r1', 1, 10);
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should handle pagination correctly', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(25);

      const result = await service.findAll('r1', 3, 10);
      expect(result.meta.page).toBe(3);
      expect(result.meta.totalPages).toBe(3);
    });
  });

  describe('findById', () => {
    it('should throw NotFoundException for non-existent user', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.findById('non-existent', 'r1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return user for valid id', async () => {
      const user = { id: 'u1', name: 'Admin', role: UserRole.ADMIN };
      mockPrismaService.user.findFirst.mockResolvedValue(user);

      const result = await service.findById('u1', 'r1');
      expect(result.id).toBe('u1');
    });
  });

  describe('create', () => {
    it('should throw ConflictException for duplicate email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create('r1', {
          name: 'Test',
          email: 'existing@test.com',
          password: 'pass123',
          role: UserRole.KITCHEN,
        } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException when trying to create SUPER_ADMIN', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.create('r1', {
          name: 'Test',
          email: 'new@test.com',
          password: 'pass123',
          role: UserRole.SUPER_ADMIN,
        } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create user successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'u1',
        name: 'New User',
        email: 'new@test.com',
        role: UserRole.KITCHEN,
      });

      const result = await service.create('r1', {
        name: 'New User',
        email: 'new@test.com',
        password: 'pass123',
        role: UserRole.KITCHEN,
      } as any);

      expect(result.name).toBe('New User');
      expect(result.role).toBe(UserRole.KITCHEN);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException for non-existent user', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.update('non-existent', 'r1', { name: 'Updated' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when changing role to SUPER_ADMIN', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: 'u1',
        email: 'user@test.com',
      });

      await expect(
        service.update('u1', 'r1', { role: UserRole.SUPER_ADMIN } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException when changing to existing email', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: 'u1',
        email: 'old@test.com',
      });
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u2', email: 'taken@test.com' });

      await expect(
        service.update('u1', 'r1', { email: 'taken@test.com' } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException for non-existent user', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.delete('non-existent', 'r1', 'current-user'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when self-deleting', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: 'u1',
      });

      await expect(
        service.delete('u1', 'r1', 'u1'), // same userId as currentUserId
      ).rejects.toThrow(ForbiddenException);
    });

    it('should soft-delete user successfully', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({ id: 'u1' });
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.delete('u1', 'r1', 'different-user');
      expect(result.message).toBe('Usuário desativado com sucesso');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { isActive: false },
      });
    });
  });
});
