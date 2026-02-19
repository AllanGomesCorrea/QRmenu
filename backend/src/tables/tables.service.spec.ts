import { Test, TestingModule } from '@nestjs/testing';
import { TablesService } from './tables.service';
import { PrismaService } from '../prisma/prisma.service';
import { QRCodeService } from './qrcode.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { TableStatus, OrderStatus } from '@prisma/client';

describe('TablesService', () => {
  let service: TablesService;

  const mockPrismaService = {
    table: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    restaurant: {
      findUnique: jest.fn(),
    },
    tableSession: {
      updateMany: jest.fn(),
      findMany: jest.fn(),
    },
    order: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockQRCodeService = {
    generateQRCodeId: jest.fn().mockReturnValue('QR-CODE-123'),
    generateTableUrl: jest.fn().mockReturnValue('http://localhost/mesa/QR-CODE-123'),
    generateQRCodeDataUrl: jest.fn(),
    generateQRCodeSvg: jest.fn(),
  };

  const mockWebsocketGateway = {
    server: {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TablesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: QRCodeService, useValue: mockQRCodeService },
        { provide: WebsocketGateway, useValue: mockWebsocketGateway },
      ],
    }).compile();

    service = module.get<TablesService>(TablesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all tables for a restaurant', async () => {
      const tables = [
        { id: 't1', number: 1, status: TableStatus.ACTIVE },
        { id: 't2', number: 2, status: TableStatus.OCCUPIED },
      ];
      mockPrismaService.table.findMany.mockResolvedValue(tables);

      const result = await service.findAll('r1');
      expect(result).toEqual(tables);
      expect(mockPrismaService.table.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { restaurantId: 'r1' },
        }),
      );
    });
  });

  describe('findById', () => {
    it('should throw NotFoundException for non-existent table', async () => {
      mockPrismaService.table.findFirst.mockResolvedValue(null);

      await expect(
        service.findById('non-existent', 'r1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return table with sessions and order count', async () => {
      const table = {
        id: 't1',
        number: 1,
        sessions: [],
        _count: { orders: 5 },
      };
      mockPrismaService.table.findFirst.mockResolvedValue(table);

      const result = await service.findById('t1', 'r1');
      expect(result.id).toBe('t1');
    });
  });

  describe('create', () => {
    it('should throw ConflictException for duplicate table number', async () => {
      mockPrismaService.table.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create('r1', { number: 1 } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should create table with QR code', async () => {
      mockPrismaService.table.findFirst.mockResolvedValue(null);
      mockPrismaService.restaurant.findUnique.mockResolvedValue({ slug: 'test-restaurant' });
      mockPrismaService.table.create.mockResolvedValue({
        id: 't1',
        number: 1,
        qrCode: 'QR-CODE-123',
      });

      const result = await service.create('r1', { number: 1 } as any);
      expect(result.qrCode).toBe('QR-CODE-123');
      expect(mockQRCodeService.generateQRCodeId).toHaveBeenCalled();
    });

    it('should throw NotFoundException when restaurant not found', async () => {
      mockPrismaService.table.findFirst.mockResolvedValue(null);
      mockPrismaService.restaurant.findUnique.mockResolvedValue(null);

      await expect(
        service.create('r1', { number: 1 } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('activateTable', () => {
    it('should throw NotFoundException for non-existent table', async () => {
      mockPrismaService.table.findFirst.mockResolvedValue(null);

      await expect(
        service.activateTable('non-existent', 'r1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if table is already active', async () => {
      mockPrismaService.table.findFirst.mockResolvedValue({
        id: 't1',
        status: TableStatus.ACTIVE,
      });

      await expect(
        service.activateTable('t1', 'r1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should activate an INACTIVE table', async () => {
      mockPrismaService.table.findFirst.mockResolvedValue({
        id: 't1',
        status: TableStatus.INACTIVE,
      });
      mockPrismaService.table.update.mockResolvedValue({
        id: 't1',
        status: TableStatus.ACTIVE,
      });

      const result = await service.activateTable('t1', 'r1');
      expect(mockPrismaService.table.update).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: { status: TableStatus.ACTIVE },
      });
    });
  });

  describe('releaseTable', () => {
    it('should throw NotFoundException for non-existent table', async () => {
      mockPrismaService.table.findFirst.mockResolvedValue(null);

      await expect(
        service.releaseTable('non-existent', 'r1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if there are pending orders', async () => {
      mockPrismaService.table.findFirst.mockResolvedValue({
        id: 't1',
        number: 1,
        name: 'Mesa 1',
        sessions: [],
      });
      mockPrismaService.order.findMany.mockResolvedValue([
        { orderNumber: 1, status: OrderStatus.PREPARING },
      ]);

      await expect(
        service.releaseTable('t1', 'r1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should release table when all orders are READY', async () => {
      mockPrismaService.table.findFirst.mockResolvedValue({
        id: 't1',
        number: 1,
        name: 'Mesa 1',
        sessions: [{ id: 's1' }],
      });
      mockPrismaService.order.findMany.mockResolvedValue([]); // No pending orders
      mockPrismaService.order.updateMany.mockResolvedValue({ count: 2 }); // Mark READY as PAID
      mockPrismaService.tableSession.findMany.mockResolvedValue([{ id: 's1' }]);
      mockPrismaService.tableSession.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.table.update.mockResolvedValue({
        id: 't1',
        status: TableStatus.ACTIVE,
      });

      const result = await service.releaseTable('t1', 'r1');

      // Should mark READY orders as PAID
      expect(mockPrismaService.order.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: OrderStatus.READY,
          }),
          data: expect.objectContaining({
            status: OrderStatus.PAID,
          }),
        }),
      );

      // Should deactivate sessions
      expect(mockPrismaService.tableSession.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isActive: false },
        }),
      );

      // Should emit session:closed to table room
      expect(mockWebsocketGateway.server.to).toHaveBeenCalledWith('table:t1');
      expect(mockWebsocketGateway.server.emit).toHaveBeenCalledWith(
        'session:closed',
        expect.objectContaining({
          reason: 'payment_completed',
        }),
      );
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException for non-existent table', async () => {
      mockPrismaService.table.findFirst.mockResolvedValue(null);

      await expect(
        service.delete('non-existent', 'r1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if table has sessions or orders', async () => {
      mockPrismaService.table.findFirst.mockResolvedValue({
        id: 't1',
        _count: { sessions: 1, orders: 0 },
      });

      await expect(
        service.delete('t1', 'r1'),
      ).rejects.toThrow(ConflictException);
    });

    it('should delete table with no sessions or orders', async () => {
      mockPrismaService.table.findFirst.mockResolvedValue({
        id: 't1',
        _count: { sessions: 0, orders: 0 },
      });
      mockPrismaService.table.delete.mockResolvedValue({});

      const result = await service.delete('t1', 'r1');
      expect(result.message).toBe('Mesa excluída com sucesso');
    });
  });

  describe('getTableStats', () => {
    it('should return table statistics', async () => {
      mockPrismaService.table.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(5) // active
        .mockResolvedValueOnce(3) // occupied
        .mockResolvedValueOnce(1); // billRequested

      const result = await service.getTableStats('r1');
      expect(result.total).toBe(10);
      expect(result.active).toBe(5);
      expect(result.occupied).toBe(3);
      expect(result.billRequested).toBe(1);
      expect(result.inactive).toBe(1); // 10 - 5 - 3 - 1
    });
  });
});
