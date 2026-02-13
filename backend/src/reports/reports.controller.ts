import {
  Controller,
  Get,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ReportsService } from './reports.service';
import { Roles, CurrentRestaurant } from '../common/decorators';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get full report data' })
  @ApiQuery({ name: 'period', enum: ['today', '7days', '30days', 'month', 'lastMonth'], required: false })
  @ApiResponse({ status: 200, description: 'Report data retrieved successfully' })
  async getFullReport(
    @CurrentRestaurant() restaurantId: string | null,
    @Query('period') period?: 'today' | '7days' | '30days' | 'month' | 'lastMonth',
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.reportsService.getFullReport(restaurantId, period || '7days');
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get statistics overview' })
  @ApiQuery({ name: 'period', enum: ['today', '7days', '30days', 'month', 'lastMonth'], required: false })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(
    @CurrentRestaurant() restaurantId: string | null,
    @Query('period') period?: 'today' | '7days' | '30days' | 'month' | 'lastMonth',
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.reportsService.getStats(restaurantId, period || '7days');
  }

  @Get('daily-sales')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get daily sales data' })
  @ApiQuery({ name: 'period', enum: ['today', '7days', '30days', 'month', 'lastMonth'], required: false })
  @ApiResponse({ status: 200, description: 'Daily sales data retrieved successfully' })
  async getDailySales(
    @CurrentRestaurant() restaurantId: string | null,
    @Query('period') period?: 'today' | '7days' | '30days' | 'month' | 'lastMonth',
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.reportsService.getDailySales(restaurantId, period || '7days');
  }

  @Get('top-items')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get top selling items' })
  @ApiQuery({ name: 'period', enum: ['today', '7days', '30days', 'month', 'lastMonth'], required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Top items retrieved successfully' })
  async getTopItems(
    @CurrentRestaurant() restaurantId: string | null,
    @Query('period') period?: 'today' | '7days' | '30days' | 'month' | 'lastMonth',
    @Query('limit') limit?: number,
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.reportsService.getTopItems(restaurantId, period || '7days', limit || 5);
  }
}

