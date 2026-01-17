import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from './crypto.service';
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private cryptoService: CryptoService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    // Check if restaurant slug already exists
    const existingRestaurant = await this.prisma.restaurant.findUnique({
      where: { slug: dto.restaurantSlug },
    });

    if (existingRestaurant) {
      throw new ConflictException('Slug do restaurante já está em uso');
    }

    // Decrypt password if encrypted, otherwise use as-is
    const password = this.cryptoService.isEncrypted(dto.password)
      ? this.cryptoService.decrypt(dto.password)
      : dto.password;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create restaurant and admin user in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create restaurant
      const restaurant = await tx.restaurant.create({
        data: {
          name: dto.restaurantName,
          slug: dto.restaurantSlug,
          address: dto.address,
          city: dto.city,
          state: dto.state,
          zipCode: dto.zipCode,
          phone: dto.restaurantPhone,
          email: dto.restaurantEmail,
        },
      });

      // Create admin user
      const user = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          password: hashedPassword,
          phone: dto.phone,
          role: UserRole.ADMIN,
          restaurantId: restaurant.id,
        },
      });

      return { user, restaurant };
    });

    // Generate tokens
    const tokens = await this.generateTokens({
      sub: result.user.id,
      email: result.user.email,
      role: result.user.role,
      restaurantId: result.restaurant.id,
      isSuperAdmin: false,
    });

    return {
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      },
      restaurant: {
        id: result.restaurant.id,
        name: result.restaurant.name,
        slug: result.restaurant.slug,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuário desativado');
    }

    // Decrypt password if encrypted, otherwise use as-is (backward compatible)
    const password = this.cryptoService.isEncrypted(dto.password)
      ? this.cryptoService.decrypt(dto.password)
      : dto.password;

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Generate tokens
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId,
      isSuperAdmin: user.isSuperAdmin,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
      },
      restaurant: user.restaurant,
      ...tokens,
    };
  }

  async refresh(dto: RefreshTokenDto) {
    // Find refresh token
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            restaurantId: true,
            isSuperAdmin: true,
            isActive: true,
          },
        },
      },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    if (storedToken.expiresAt < new Date()) {
      // Delete expired token
      await this.prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });
      throw new UnauthorizedException('Refresh token expirado');
    }

    if (!storedToken.user.isActive) {
      throw new UnauthorizedException('Usuário desativado');
    }

    // Delete old refresh token
    await this.prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    // Generate new tokens
    const tokens = await this.generateTokens({
      sub: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
      restaurantId: storedToken.user.restaurantId,
      isSuperAdmin: storedToken.user.isSuperAdmin,
    });

    return tokens;
  }

  async logout(refreshToken: string) {
    // Delete refresh token if exists
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });

    return { message: 'Logout realizado com sucesso' };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuário não encontrado ou inativo');
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
      },
      restaurant: user.restaurant,
    };
  }

  private async generateTokens(payload: JwtPayload) {
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    });

    const refreshToken = uuidv4();
    const refreshExpiresIn = this.configService.get<string>(
      'jwt.refreshExpiresIn',
    );

    // Parse refresh expiration (e.g., "7d" -> 7 days)
    const refreshExpiresDays = parseInt(refreshExpiresIn?.replace('d', '') || '7');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshExpiresDays);

    // Store refresh token in database
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: payload.sub,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    };
  }
}

