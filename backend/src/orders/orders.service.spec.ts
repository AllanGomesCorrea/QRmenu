import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { OrderStatus, OrderItemStatus, TableStatus } from '@prisma/client';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: any;
  let redis: any;

  const mockPrismaService = {
    tableSession: {
      findUnique: jest.fn(),
    },
    menuItem: {
      findMany: jest.fn(),
    },
    order: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      updateMany: jest.fn(),
    },
    orderItem: {
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    orderLog: {
      create: jest.fn(),
    },
    table: {
      update: jest.fn(),
    },
  };

  const mockRedisService = {
    publish: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get<RedisService>(RedisService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('getTableOrdersForSession', () => {
    it('should return empty array if session not found', async () => {
      mockPrismaService.tableSession.findUnique.mockResolvedValue(null);
      const result = await service.getTableOrdersForSession('non-existent');
      expect(result).toEqual([]);
    });

    it('should only return orders from active sessions', async () => {
      const sessionId = 'session-1';
      const tableId = 'table-1';

      mockPrismaService.tableSession.findUnique.mockResolvedValue({ tableId });
      
      const orders = [
        {
          id: 'order-1',
          sessionId: 'session-1',
          tableId,
          status: OrderStatus.READY,
          items: [],
          session: { id: 'session-1', customerName: 'João', customerPhone: '999' },
        },
        {
          id: 'order-2',
          sessionId: 'session-2',
          tableId,
          status: OrderStatus.PENDING,
          items: [],
          session: { id: 'session-2', customerName: 'Maria', customerPhone: '888' },
        },
      ];

      mockPrismaService.order.findMany.mockResolvedValue(orders);

      const result = await service.getTableOrdersForSession(sessionId);

      // Verify the where clause filters by active sessions
      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tableId,
            session: { isActive: true },
          }),
        }),
      );

      // Verify isMyOrder flag
      expect(result[0].isMyOrder).toBe(true);
      expect(result[1].isMyOrder).toBe(false);
    });
  });

  describe('getRestaurantOrders', () => {
    it('should return orders with total count', async () => {
      const orders = [{ id: 'order-1', status: OrderStatus.PENDING }];
      mockPrismaService.order.findMany.mockResolvedValue(orders);
      mockPrismaService.order.count.mockResolvedValue(1);

      const result = await service.getRestaurantOrders('restaurant-1', { limit: 10 });

      expect(result.orders).toEqual(orders);
      expect(result.total).toBe(1);
    });

    it('should filter by active sessions when activeSessionsOnly is true', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([]);
      mockPrismaService.order.count.mockResolvedValue(0);

      await service.getRestaurantOrders('restaurant-1', { activeSessionsOnly: true });

      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            session: { isActive: true },
          }),
        }),
      );
    });

    it('should support pagination with limit and offset', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([]);
      mockPrismaService.order.count.mockResolvedValue(50);

      await service.getRestaurantOrders('restaurant-1', { limit: 10, offset: 20 });

      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        }),
      );
    });

    it('should filter by status when provided', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([]);
      mockPrismaService.order.count.mockResolvedValue(0);

      await service.getRestaurantOrders('restaurant-1', { status: OrderStatus.PENDING });

      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: OrderStatus.PENDING,
          }),
        }),
      );
    });

    it('should filter by date range', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([]);
      mockPrismaService.order.count.mockResolvedValue(0);

      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');

      await service.getRestaurantOrders('restaurant-1', { startDate, endDate });

      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { gte: startDate, lte: endDate },
          }),
        }),
      );
    });
  });

  describe('validateStatusTransition', () => {
    it('should allow valid transitions', async () => {
      const order = { id: 'o1', status: OrderStatus.PENDING, restaurantId: 'r1' };
      mockPrismaService.order.findFirst.mockResolvedValue(order);
      mockPrismaService.order.update.mockResolvedValue({ ...order, status: OrderStatus.CONFIRMED });
      mockRedisService.publish.mockResolvedValue(undefined);

      await expect(
        service.updateOrderStatus('o1', 'r1', { status: OrderStatus.CONFIRMED }, 'user-1'),
      ).resolves.toBeDefined();
    });

    it('should reject invalid transitions', async () => {
      const order = { id: 'o1', status: OrderStatus.PAID, restaurantId: 'r1' };
      mockPrismaService.order.findFirst.mockResolvedValue(order);

      await expect(
        service.updateOrderStatus('o1', 'r1', { status: OrderStatus.PENDING }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should not allow cancelling paid orders', async () => {
      const order = { id: 'o1', status: OrderStatus.PAID, restaurantId: 'r1' };
      mockPrismaService.order.findFirst.mockResolvedValue(order);

      await expect(
        service.cancelOrder('o1', 'r1', 'Test reason', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getOrderStats', () => {
    it('should return stats with revenue', async () => {
      mockPrismaService.order.count.mockResolvedValue(10);
      mockPrismaService.order.aggregate.mockResolvedValue({
        _sum: { total: { toString: () => '500.00' } },
      });

      const result = await service.getOrderStats('restaurant-1');

      expect(result).toHaveProperty('totalOrders');
      expect(result).toHaveProperty('revenue');
    });

    it('should return 0 revenue when no orders', async () => {
      mockPrismaService.order.count.mockResolvedValue(0);
      mockPrismaService.order.aggregate.mockResolvedValue({
        _sum: { total: null },
      });

      const result = await service.getOrderStats('restaurant-1');
      expect(result.revenue).toBe(0);
    });
  });

  describe('createFromSession', () => {
    it('should throw ForbiddenException for inactive session', async () => {
      mockPrismaService.tableSession.findUnique.mockResolvedValue({
        id: 'session-1',
        isActive: false,
        isVerified: true,
        table: { restaurantId: 'r1', restaurant: {} },
      });

      await expect(
        service.createFromSession('session-1', { items: [] }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException for unverified session', async () => {
      mockPrismaService.tableSession.findUnique.mockResolvedValue({
        id: 'session-1',
        isActive: true,
        isVerified: false,
        table: { restaurantId: 'r1', restaurant: {} },
      });

      await expect(
        service.createFromSession('session-1', { items: [] }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('cancelOrder', () => {
    it('should throw NotFoundException if order not found', async () => {
      mockPrismaService.order.findFirst.mockResolvedValue(null);

      await expect(
        service.cancelOrder('non-existent', 'r1', 'reason', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
