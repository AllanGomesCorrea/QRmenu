import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CryptoService } from './crypto.service';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');
jest.mock('uuid', () => ({ v4: () => 'mock-uuid-token' }));

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    restaurant: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, any> = {
        'jwt.secret': 'test-secret',
        'jwt.expiresIn': '15m',
        'jwt.refreshExpiresIn': '7d',
      };
      return config[key];
    }),
  };

  const mockCryptoService = {
    isEncrypted: jest.fn().mockReturnValue(false),
    decrypt: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: CryptoService, useValue: mockCryptoService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should throw UnauthorizedException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'test@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        password: 'hashed',
        isActive: false,
        role: UserRole.ADMIN,
        restaurantId: 'r1',
        restaurant: { id: 'r1', name: 'Test', slug: 'test' },
      });

      await expect(
        service.login({ email: 'test@test.com', password: 'test123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        password: 'hashed',
        isActive: true,
        role: UserRole.ADMIN,
        restaurantId: 'r1',
        isSuperAdmin: false,
        restaurant: { id: 'r1', name: 'Test', slug: 'test' },
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens and user data on successful login', async () => {
      const user = {
        id: 'user-1',
        name: 'Admin',
        email: 'admin@test.com',
        password: 'hashed',
        isActive: true,
        role: UserRole.ADMIN,
        restaurantId: 'r1',
        isSuperAdmin: false,
        restaurant: { id: 'r1', name: 'Test Restaurant', slug: 'test' },
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.login({
        email: 'admin@test.com',
        password: 'correct-password',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('restaurant');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('admin@test.com');
      expect(result.user.role).toBe(UserRole.ADMIN);
    });
  });

  describe('register', () => {
    it('should throw ConflictException when email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register({
          name: 'Test',
          email: 'existing@test.com',
          password: 'pass123',
          phone: '11999999999',
          restaurantName: 'Test',
          restaurantSlug: 'test',
          address: '123 St',
          city: 'SP',
          state: 'SP',
          zipCode: '01000000',
        } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when restaurant slug exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.restaurant.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register({
          name: 'Test',
          email: 'new@test.com',
          password: 'pass123',
          phone: '11999999999',
          restaurantName: 'Test',
          restaurantSlug: 'existing-slug',
          address: '123 St',
          city: 'SP',
          state: 'SP',
          zipCode: '01000000',
        } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('refresh', () => {
    it('should throw UnauthorizedException for invalid refresh token', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect(
        service.refresh({ refreshToken: 'invalid' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired refresh token', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: 'rt1',
        token: 'expired-token',
        expiresAt: pastDate,
        user: {
          id: 'user-1',
          email: 'test@test.com',
          role: UserRole.ADMIN,
          restaurantId: 'r1',
          isSuperAdmin: false,
          isActive: true,
        },
      });

      await expect(
        service.refresh({ refreshToken: 'expired-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should delete refresh token', async () => {
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.logout('some-token');
      expect(result.message).toBe('Logout realizado com sucesso');
      expect(mockPrismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { token: 'some-token' },
      });
    });
  });

  describe('validateUser', () => {
    it('should throw UnauthorizedException for non-existent user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.validateUser('non-existent')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return user and restaurant data for valid user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Admin',
        email: 'admin@test.com',
        role: UserRole.ADMIN,
        isSuperAdmin: false,
        isActive: true,
        restaurant: { id: 'r1', name: 'Test', slug: 'test' },
      });

      const result = await service.validateUser('user-1');
      expect(result.user.id).toBe('user-1');
      expect(result.restaurant).toBeDefined();
    });
  });
});
