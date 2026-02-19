import { Test, TestingModule } from '@nestjs/testing';
import { SessionsService } from './sessions.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { VerificationService } from './verification.service';
import { ConfigService } from '@nestjs/config';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { TableStatus } from '@prisma/client';

describe('SessionsService', () => {
  let service: SessionsService;

  const mockPrismaService = {
    table: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    tableSession: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    verificationCode: {
      create: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockRedisService = {
    getJson: jest.fn(),
    setJson: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    set: jest.fn(),
    ttl: jest.fn(),
    publish: jest.fn(),
  };

  const mockVerificationService = {
    sendVerificationCode: jest.fn(),
    verifyCode: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        'security.geolocationEnabled': false, // Disable for testing
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: VerificationService, useValue: mockVerificationService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
    jest.clearAllMocks();
  });

  describe('checkTableStatus', () => {
    it('should throw NotFoundException when table not found', async () => {
      mockPrismaService.table.findUnique.mockResolvedValue(null);

      await expect(
        service.checkTableStatus('INVALID-QR'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for inactive restaurant', async () => {
      mockPrismaService.table.findUnique.mockResolvedValue({
        id: 't1',
        number: 1,
        name: 'Mesa 1',
        status: TableStatus.ACTIVE,
        capacity: 4,
        restaurant: {
          id: 'r1',
          name: 'Test',
          slug: 'test',
          logoUrl: null,
          isActive: false,
          settings: null,
          latitude: null,
          longitude: null,
        },
        _count: { sessions: 0 },
      });

      await expect(
        service.checkTableStatus('VALID-QR'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for INACTIVE table', async () => {
      mockPrismaService.table.findUnique.mockResolvedValue({
        id: 't1',
        number: 1,
        name: 'Mesa 1',
        status: TableStatus.INACTIVE,
        capacity: 4,
        restaurant: {
          id: 'r1',
          name: 'Test',
          slug: 'test',
          logoUrl: null,
          isActive: true,
          settings: null,
          latitude: null,
          longitude: null,
        },
        _count: { sessions: 0 },
      });

      await expect(
        service.checkTableStatus('VALID-QR'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return table status for valid active table', async () => {
      mockPrismaService.table.findUnique.mockResolvedValue({
        id: 't1',
        number: 1,
        name: 'Mesa 1',
        status: TableStatus.ACTIVE,
        capacity: 4,
        restaurant: {
          id: 'r1',
          name: 'Test',
          slug: 'test',
          logoUrl: null,
          isActive: true,
          settings: { operatingHours: { enabled: false } },
          latitude: null,
          longitude: null,
        },
        _count: { sessions: 0 },
      });

      const result = await service.checkTableStatus('VALID-QR');
      expect(result.table.id).toBe('t1');
      expect(result.table.activeSessions).toBe(0);
      expect(result.restaurant.name).toBe('Test');
      expect(result.canJoin).toBe(true);
    });

    it('should report canJoin false when table is at capacity', async () => {
      mockPrismaService.table.findUnique.mockResolvedValue({
        id: 't1',
        number: 1,
        name: 'Mesa 1',
        status: TableStatus.OCCUPIED,
        capacity: 2,
        restaurant: {
          id: 'r1',
          name: 'Test',
          slug: 'test',
          logoUrl: null,
          isActive: true,
          settings: { operatingHours: { enabled: false } },
          latitude: null,
          longitude: null,
        },
        _count: { sessions: 2 }, // Full capacity
      });

      const result = await service.checkTableStatus('VALID-QR');
      expect(result.canJoin).toBe(false);
    });
  });

  describe('checkExistingSession', () => {
    it('should throw NotFoundException when table not found', async () => {
      mockPrismaService.table.findUnique.mockResolvedValue(null);

      await expect(
        service.checkExistingSession('INVALID-QR', 'fingerprint'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return hasSession false when no existing session', async () => {
      mockPrismaService.table.findUnique.mockResolvedValue({ id: 't1' });
      mockPrismaService.tableSession.findFirst.mockResolvedValue(null);

      const result = await service.checkExistingSession('VALID-QR', 'new-fingerprint');
      expect(result.hasSession).toBe(false);
    });

    it('should return hasSession true with session data', async () => {
      mockPrismaService.table.findUnique.mockResolvedValue({ id: 't1' });
      mockPrismaService.tableSession.findFirst.mockResolvedValue({
        id: 's1',
        customerName: 'João',
        isVerified: true,
      });

      const result = await service.checkExistingSession('VALID-QR', 'known-fingerprint');
      expect(result.hasSession).toBe(true);
      expect(result.session?.customerName).toBe('João');
    });
  });

  describe('validateSessionToken', () => {
    it('should return null when no token found in Redis', async () => {
      mockRedisService.getJson.mockResolvedValue(null);

      const result = await service.validateSessionToken('invalid-token');
      expect(result).toBeNull();
    });

    it('should return null and clean up when session is inactive', async () => {
      mockRedisService.getJson.mockResolvedValue({
        sessionId: 's1',
        tableId: 't1',
        restaurantId: 'r1',
      });
      mockPrismaService.tableSession.findUnique.mockResolvedValue({
        id: 's1',
        isActive: false,
        isVerified: true,
      });

      const result = await service.validateSessionToken('expired-token');
      expect(result).toBeNull();
      expect(mockRedisService.del).toHaveBeenCalled();
    });

    it('should return session data for valid token', async () => {
      const sessionData = {
        sessionId: 's1',
        tableId: 't1',
        restaurantId: 'r1',
      };

      mockRedisService.getJson.mockResolvedValue(sessionData);
      mockPrismaService.tableSession.findUnique.mockResolvedValue({
        id: 's1',
        isActive: true,
        isVerified: true,
      });

      const result = await service.validateSessionToken('valid-token');
      expect(result).toEqual(sessionData);
    });
  });

  describe('endSession', () => {
    it('should throw NotFoundException when session not found', async () => {
      mockPrismaService.tableSession.findUnique.mockResolvedValue(null);

      await expect(service.endSession('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should deactivate session and set table to ACTIVE if no other sessions', async () => {
      mockPrismaService.tableSession.findUnique.mockResolvedValue({
        id: 's1',
        tableId: 't1',
      });
      mockPrismaService.tableSession.update.mockResolvedValue({});
      mockPrismaService.tableSession.count.mockResolvedValue(0);
      mockPrismaService.table.update.mockResolvedValue({});

      const result = await service.endSession('s1');
      expect(result.message).toBe('Sessão encerrada com sucesso');
      expect(mockPrismaService.table.update).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: { status: TableStatus.ACTIVE },
      });
    });

    it('should NOT change table status if other active sessions exist', async () => {
      mockPrismaService.tableSession.findUnique.mockResolvedValue({
        id: 's1',
        tableId: 't1',
      });
      mockPrismaService.tableSession.update.mockResolvedValue({});
      mockPrismaService.tableSession.count.mockResolvedValue(1); // 1 other session

      await service.endSession('s1');
      expect(mockPrismaService.table.update).not.toHaveBeenCalled();
    });
  });

  describe('getSession', () => {
    it('should throw NotFoundException for non-existent session', async () => {
      mockPrismaService.tableSession.findUnique.mockResolvedValue(null);

      await expect(service.getSession('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException for inactive session', async () => {
      mockPrismaService.tableSession.findUnique.mockResolvedValue({
        id: 's1',
        isActive: false,
        table: { restaurant: {} },
        orders: [],
      });

      await expect(service.getSession('s1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return session for valid active session', async () => {
      const session = {
        id: 's1',
        isActive: true,
        table: {
          restaurant: { id: 'r1', name: 'Test', slug: 'test' },
        },
        orders: [],
      };
      mockPrismaService.tableSession.findUnique.mockResolvedValue(session);

      const result = await service.getSession('s1');
      expect(result.id).toBe('s1');
      expect(result.isActive).toBe(true);
    });
  });

  describe('createSession', () => {
    it('should throw NotFoundException when table not found', async () => {
      mockPrismaService.table.findUnique.mockResolvedValue(null);

      await expect(
        service.createSession(
          {
            qrCode: 'INVALID',
            customerName: 'Test',
            customerPhone: '11999999999',
            deviceFingerprint: 'fp1',
          },
          '127.0.0.1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for INACTIVE table', async () => {
      mockPrismaService.table.findUnique.mockResolvedValue({
        id: 't1',
        status: TableStatus.INACTIVE,
        capacity: 4,
        restaurant: {
          settings: null,
          latitude: null,
          longitude: null,
        },
        _count: { sessions: 0 },
      });

      await expect(
        service.createSession(
          {
            qrCode: 'QR1',
            customerName: 'Test',
            customerPhone: '11999999999',
            deviceFingerprint: 'fp1',
          },
          '127.0.0.1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when table is at capacity', async () => {
      mockPrismaService.table.findUnique.mockResolvedValue({
        id: 't1',
        status: TableStatus.OCCUPIED,
        capacity: 2,
        restaurantId: 'r1',
        restaurant: {
          settings: { operatingHours: { enabled: false } },
          latitude: null,
          longitude: null,
        },
        _count: { sessions: 2 }, // At capacity
      });

      await expect(
        service.createSession(
          {
            qrCode: 'QR1',
            customerName: 'Test',
            customerPhone: '11999999999',
            deviceFingerprint: 'fp1',
          },
          '127.0.0.1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return existing session if fingerprint matches', async () => {
      const existingSession = {
        id: 's1',
        customerName: 'Test',
        isActive: true,
      };

      mockPrismaService.table.findUnique.mockResolvedValue({
        id: 't1',
        status: TableStatus.ACTIVE,
        capacity: 4,
        restaurantId: 'r1',
        restaurant: {
          settings: { operatingHours: { enabled: false } },
          latitude: null,
          longitude: null,
        },
        _count: { sessions: 1 },
      });
      mockPrismaService.tableSession.findFirst.mockResolvedValue(existingSession);

      const result = await service.createSession(
        {
          qrCode: 'QR1',
          customerName: 'Test',
          customerPhone: '11999999999',
          deviceFingerprint: 'known-fp',
        },
        '127.0.0.1',
      );

      expect(result.id).toBe('s1');
      expect(mockPrismaService.tableSession.create).not.toHaveBeenCalled();
    });
  });
});
