import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { TableStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { VerificationService } from './verification.service';
import { CreateSessionDto, VerifyCodeDto, RequestCodeDto } from './dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SessionsService {
  private readonly sessionTimeout: number;
  private readonly maxSessionsPerTable: number;

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private verificationService: VerificationService,
    private configService: ConfigService,
  ) {
    // Session timeout in hours (default 4 hours)
    this.sessionTimeout = 4 * 60 * 60 * 1000; // 4 hours in ms
    this.maxSessionsPerTable = this.configService.get<number>('security.maxSessionsPerTable', 10);
  }

  /**
   * Check if table is available for new sessions
   */
  async checkTableStatus(qrCode: string) {
    const table = await this.prisma.table.findUnique({
      where: { qrCode },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            isActive: true,
          },
        },
        _count: {
          select: { sessions: { where: { isActive: true } } },
        },
      },
    });

    if (!table) {
      throw new NotFoundException('Mesa não encontrada');
    }

    if (!table.restaurant.isActive) {
      throw new BadRequestException('Restaurante não está disponível');
    }

    // Check if table is active (waiter must activate it)
    if (table.status === TableStatus.INACTIVE) {
      throw new BadRequestException(
        'Mesa não está disponível. Por favor, aguarde o garçom ativar a mesa.',
      );
    }

    if (table.status === TableStatus.CLOSED) {
      throw new BadRequestException(
        'Mesa está sendo preparada. Por favor, aguarde.',
      );
    }

    return {
      table: {
        id: table.id,
        number: table.number,
        name: table.name,
        status: table.status,
        activeSessions: table._count.sessions,
      },
      restaurant: table.restaurant,
      canJoin: table._count.sessions < this.maxSessionsPerTable,
    };
  }

  /**
   * Check if device already has an active session
   */
  async checkExistingSession(qrCode: string, deviceFingerprint: string) {
    const table = await this.prisma.table.findUnique({
      where: { qrCode },
    });

    if (!table) {
      throw new NotFoundException('Mesa não encontrada');
    }

    // Check for existing session with this fingerprint
    const existingSession = await this.prisma.tableSession.findFirst({
      where: {
        tableId: table.id,
        deviceFingerprint,
        isActive: true,
      },
    });

    if (existingSession) {
      return {
        hasSession: true,
        session: {
          id: existingSession.id,
          customerName: existingSession.customerName,
          isVerified: existingSession.isVerified,
        },
      };
    }

    return { hasSession: false };
  }

  /**
   * Request verification code
   */
  async requestVerificationCode(dto: RequestCodeDto) {
    const table = await this.prisma.table.findUnique({
      where: { qrCode: dto.qrCode },
      include: { restaurant: true },
    });

    if (!table) {
      throw new NotFoundException('Mesa não encontrada');
    }

    // Check table status
    if (table.status === TableStatus.INACTIVE || table.status === TableStatus.CLOSED) {
      throw new BadRequestException('Mesa não está disponível');
    }

    return this.verificationService.sendVerificationCode({
      phone: dto.customerPhone,
      tableId: table.id,
      restaurantId: table.restaurantId,
    });
  }

  /**
   * Create session after verification
   */
  async createSession(dto: CreateSessionDto, ipAddress: string) {
    const table = await this.prisma.table.findUnique({
      where: { qrCode: dto.qrCode },
      include: {
        restaurant: true,
        _count: { select: { sessions: { where: { isActive: true } } } },
      },
    });

    if (!table) {
      throw new NotFoundException('Mesa não encontrada');
    }

    // Check table status
    if (table.status === TableStatus.INACTIVE || table.status === TableStatus.CLOSED) {
      throw new BadRequestException('Mesa não está disponível');
    }

    // Check max sessions
    if (table._count.sessions >= this.maxSessionsPerTable) {
      throw new BadRequestException('Mesa atingiu o limite de pessoas');
    }

    // Check for existing session with same fingerprint
    const existingSession = await this.prisma.tableSession.findFirst({
      where: {
        tableId: table.id,
        deviceFingerprint: dto.deviceFingerprint,
        isActive: true,
      },
    });

    if (existingSession) {
      // Return existing session
      return existingSession;
    }

    // Calculate expiration (4 hours from now or when table closes)
    const expiresAt = new Date(Date.now() + this.sessionTimeout);

    // Create new session (unverified)
    const session = await this.prisma.tableSession.create({
      data: {
        customerName: dto.customerName,
        customerPhone: dto.customerPhone.replace(/\D/g, ''),
        deviceFingerprint: dto.deviceFingerprint,
        ipAddress,
        userAgent: dto.userAgent || '',
        tableId: table.id,
        isVerified: false,
        expiresAt,
      },
    });

    // Update table status to OCCUPIED if first session
    if (table._count.sessions === 0) {
      await this.prisma.table.update({
        where: { id: table.id },
        data: { status: TableStatus.OCCUPIED },
      });
    }

    return session;
  }

  /**
   * Verify code and activate session
   */
  async verifyAndActivate(dto: VerifyCodeDto, ipAddress: string) {
    const table = await this.prisma.table.findUnique({
      where: { qrCode: dto.qrCode },
    });

    if (!table) {
      throw new NotFoundException('Mesa não encontrada');
    }

    // Verify the code
    const verification = await this.verificationService.verifyCode(
      dto.customerPhone,
      dto.code,
      table.id,
    );

    if (!verification.valid) {
      throw new BadRequestException(verification.message);
    }

    // Find the unverified session
    const session = await this.prisma.tableSession.findFirst({
      where: {
        tableId: table.id,
        customerPhone: dto.customerPhone.replace(/\D/g, ''),
        deviceFingerprint: dto.deviceFingerprint,
        isActive: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    // Mark session as verified
    const verifiedSession = await this.prisma.tableSession.update({
      where: { id: session.id },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
      },
      include: {
        table: {
          include: {
            restaurant: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    // Generate session token for API calls
    const sessionToken = await this.generateSessionToken(verifiedSession.id);

    return {
      session: verifiedSession,
      sessionToken,
    };
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string) {
    const session = await this.prisma.tableSession.findUnique({
      where: { id: sessionId },
      include: {
        table: {
          include: {
            restaurant: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    if (!session.isActive) {
      throw new ForbiddenException('Sessão expirada');
    }

    return session;
  }

  /**
   * Validate session token from request
   */
  async validateSessionToken(token: string) {
    const sessionData = await this.redis.getJson<{
      sessionId: string;
      tableId: string;
      restaurantId: string;
    }>(`session:token:${token}`);

    if (!sessionData) {
      return null;
    }

    // Verify session is still active
    const session = await this.prisma.tableSession.findUnique({
      where: { id: sessionData.sessionId },
    });

    if (!session || !session.isActive || !session.isVerified) {
      await this.redis.del(`session:token:${token}`);
      return null;
    }

    return sessionData;
  }

  /**
   * End session
   */
  async endSession(sessionId: string) {
    const session = await this.prisma.tableSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    await this.prisma.tableSession.update({
      where: { id: sessionId },
      data: { isActive: false },
    });

    // Check if there are other active sessions on the table
    const otherSessions = await this.prisma.tableSession.count({
      where: {
        tableId: session.tableId,
        isActive: true,
        id: { not: sessionId },
      },
    });

    // If no more sessions, update table status
    if (otherSessions === 0) {
      await this.prisma.table.update({
        where: { id: session.tableId },
        data: { status: TableStatus.ACTIVE },
      });
    }

    return { message: 'Sessão encerrada com sucesso' };
  }

  /**
   * Generate a session token for authenticated API calls
   */
  private async generateSessionToken(sessionId: string): Promise<string> {
    const session = await this.prisma.tableSession.findUnique({
      where: { id: sessionId },
      include: { table: true },
    });

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    // Generate random token
    const token = `sess_${Buffer.from(
      `${sessionId}:${Date.now()}:${Math.random().toString(36)}`,
    ).toString('base64url')}`;

    // Store in Redis
    await this.redis.setJson(
      `session:token:${token}`,
      {
        sessionId,
        tableId: session.tableId,
        restaurantId: session.table.restaurantId,
      },
      this.sessionTimeout / 1000, // Convert to seconds
    );

    return token;
  }
}

