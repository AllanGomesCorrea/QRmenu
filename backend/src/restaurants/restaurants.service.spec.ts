import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantsService } from './restaurants.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('RestaurantsService', () => {
  let service: RestaurantsService;

  const mockPrismaService = {
    restaurant: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    order: {
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    table: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestaurantsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<RestaurantsService>(RestaurantsService);
    jest.clearAllMocks();
  });

  describe('findBySlug', () => {
    it('should throw NotFoundException when restaurant not found', async () => {
      mockPrismaService.restaurant.findUnique.mockResolvedValue(null);

      await expect(
        service.findBySlug('non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when restaurant is inactive', async () => {
      mockPrismaService.restaurant.findUnique.mockResolvedValue({
        id: 'r1',
        slug: 'test',
        isActive: false,
      });

      await expect(
        service.findBySlug('test'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return restaurant for valid slug', async () => {
      const restaurant = {
        id: 'r1',
        name: 'Test Restaurant',
        slug: 'test',
        isActive: true,
      };
      mockPrismaService.restaurant.findUnique.mockResolvedValue(restaurant);

      const result = await service.findBySlug('test');
      expect(result.name).toBe('Test Restaurant');
    });
  });

  describe('findById', () => {
    it('should throw NotFoundException when not found', async () => {
      mockPrismaService.restaurant.findUnique.mockResolvedValue(null);

      await expect(
        service.findById('non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return restaurant for valid id', async () => {
      const restaurant = { id: 'r1', name: 'Test' };
      mockPrismaService.restaurant.findUnique.mockResolvedValue(restaurant);

      const result = await service.findById('r1');
      expect(result.id).toBe('r1');
    });
  });

  describe('update', () => {
    it('should throw NotFoundException when restaurant not found', async () => {
      mockPrismaService.restaurant.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { name: 'New Name' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update restaurant successfully', async () => {
      mockPrismaService.restaurant.findUnique.mockResolvedValue({ id: 'r1' });
      mockPrismaService.restaurant.update.mockResolvedValue({
        id: 'r1',
        name: 'Updated Name',
      });

      const result = await service.update('r1', { name: 'Updated Name' } as any);
      expect(result.name).toBe('Updated Name');
    });

    it('should update logoUrl and bannerUrl', async () => {
      mockPrismaService.restaurant.findUnique.mockResolvedValue({ id: 'r1' });
      mockPrismaService.restaurant.update.mockResolvedValue({
        id: 'r1',
        logoUrl: 'https://example.com/logo.png',
        bannerUrl: 'https://example.com/banner.jpg',
      });

      const result = await service.update('r1', {
        logoUrl: 'https://example.com/logo.png',
        bannerUrl: 'https://example.com/banner.jpg',
      } as any);

      expect(mockPrismaService.restaurant.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: expect.objectContaining({
          logoUrl: 'https://example.com/logo.png',
          bannerUrl: 'https://example.com/banner.jpg',
        }),
      });
      expect(result.logoUrl).toBe('https://example.com/logo.png');
      expect(result.bannerUrl).toBe('https://example.com/banner.jpg');
    });

    it('should clear logoUrl by setting empty string', async () => {
      mockPrismaService.restaurant.findUnique.mockResolvedValue({
        id: 'r1',
        logoUrl: 'https://example.com/old-logo.png',
      });
      mockPrismaService.restaurant.update.mockResolvedValue({
        id: 'r1',
        logoUrl: '',
      });

      const result = await service.update('r1', { logoUrl: '' } as any);

      expect(mockPrismaService.restaurant.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: expect.objectContaining({
          logoUrl: '',
        }),
      });
      expect(result.logoUrl).toBe('');
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const restaurants = [
        { id: 'r1', name: 'Restaurant 1' },
        { id: 'r2', name: 'Restaurant 2' },
      ];
      mockPrismaService.restaurant.findMany.mockResolvedValue(restaurants);
      mockPrismaService.restaurant.count.mockResolvedValue(2);

      const result = await service.findAll(1, 10);
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should filter by search term', async () => {
      mockPrismaService.restaurant.findMany.mockResolvedValue([]);
      mockPrismaService.restaurant.count.mockResolvedValue(0);

      await service.findAll(1, 10, 'pizza');

      expect(mockPrismaService.restaurant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.objectContaining({ contains: 'pizza' }) }),
            ]),
          }),
        }),
      );
    });
  });

  describe('findAllPublic', () => {
    it('should only return active restaurants', async () => {
      mockPrismaService.restaurant.findMany.mockResolvedValue([]);
      mockPrismaService.restaurant.count.mockResolvedValue(0);

      await service.findAllPublic(1, 20);

      expect(mockPrismaService.restaurant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        }),
      );
    });

    it('should filter by city', async () => {
      mockPrismaService.restaurant.findMany.mockResolvedValue([]);
      mockPrismaService.restaurant.count.mockResolvedValue(0);

      await service.findAllPublic(1, 20, undefined, 'São Paulo');

      expect(mockPrismaService.restaurant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            city: expect.objectContaining({ contains: 'São Paulo' }),
          }),
        }),
      );
    });
  });

  describe('getStats', () => {
    it('should return restaurant statistics', async () => {
      mockPrismaService.order.count
        .mockResolvedValueOnce(100) // totalOrders
        .mockResolvedValueOnce(10); // todayOrders
      mockPrismaService.table.count.mockResolvedValue(5);
      mockPrismaService.order.aggregate.mockResolvedValue({
        _sum: { total: 5000 },
      });

      const result = await service.getStats('r1');
      expect(result.totalOrders).toBe(100);
      expect(result.todayOrders).toBe(10);
      expect(result.activeTables).toBe(5);
      expect(result.totalRevenue).toBe(5000);
    });
  });
});
