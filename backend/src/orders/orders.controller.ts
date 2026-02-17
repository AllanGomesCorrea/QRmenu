import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Headers,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiHeader,
} from '@nestjs/swagger';
import { UserRole, OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';
import { SessionsService } from '../sessions/sessions.service';
import { CreateOrderDto, UpdateOrderStatusDto, UpdateOrderItemStatusDto } from './dto';
import { Public, Roles, CurrentUser, CurrentRestaurant } from '../common/decorators';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly sessionsService: SessionsService,
  ) {}

  // ============= Customer Endpoints (Session-based) =============

  @Public()
  @Post('session')
  @ApiHeader({ name: 'x-session-token', required: true })
  @ApiOperation({ summary: 'Criar pedido (cliente)' })
  @ApiResponse({ status: 201, description: 'Pedido criado' })
  async createFromSession(
    @Headers('x-session-token') sessionToken: string,
    @Body() dto: CreateOrderDto,
  ) {
    const tokenData = await this.sessionsService.validateSessionToken(sessionToken);
    if (!tokenData) {
      throw new ForbiddenException('Sessão inválida ou expirada');
    }

    return this.ordersService.createFromSession(tokenData.sessionId, dto);
  }

  @Public()
  @Get('session/my-orders')
  @ApiHeader({ name: 'x-session-token', required: true })
  @ApiOperation({ summary: 'Listar todos os pedidos da mesa (destacando os próprios)' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos da mesa com isMyOrder flag' })
  async getTableOrders(@Headers('x-session-token') sessionToken: string) {
    const tokenData = await this.sessionsService.validateSessionToken(sessionToken);
    if (!tokenData) {
      throw new ForbiddenException('Sessão inválida ou expirada');
    }

    return this.ordersService.getTableOrdersForSession(tokenData.sessionId);
  }

  @Public()
  @Get('session/:orderId')
  @ApiHeader({ name: 'x-session-token', required: true })
  @ApiOperation({ summary: 'Ver detalhes do pedido (cliente)' })
  @ApiResponse({ status: 200, description: 'Detalhes do pedido' })
  async getSessionOrderById(
    @Param('orderId') orderId: string,
    @Headers('x-session-token') sessionToken: string,
  ) {
    const tokenData = await this.sessionsService.validateSessionToken(sessionToken);
    if (!tokenData) {
      throw new ForbiddenException('Sessão inválida ou expirada');
    }

    const order = await this.ordersService.getOrderById(orderId);
    
    // Verify order belongs to session
    if (order.sessionId !== tokenData.sessionId) {
      throw new ForbiddenException('Pedido não pertence a esta sessão');
    }

    return order;
  }

  // ============= Staff Endpoints (JWT Auth) =============

  @Get('kitchen')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.KITCHEN, UserRole.WAITER)
  @ApiOperation({ summary: 'Pedidos para a cozinha' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos' })
  async getKitchenOrders(@CurrentRestaurant() restaurantId: string | null) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não vinculado a um restaurante');
    }

    return this.ordersService.getKitchenOrders(restaurantId);
  }

  @Get()
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Listar todos os pedidos' })
  @ApiQuery({ name: 'status', enum: OrderStatus, required: false })
  @ApiQuery({ name: 'tableId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiResponse({ status: 200, description: 'Lista de pedidos' })
  async getOrders(
    @CurrentRestaurant() restaurantId: string | null,
    @Query('status') status?: OrderStatus,
    @Query('tableId') tableId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não vinculado a um restaurante');
    }

    return this.ordersService.getRestaurantOrders(restaurantId, {
      status,
      tableId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  @Get('stats')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Estatísticas de pedidos' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'Estatísticas' })
  async getStats(
    @CurrentRestaurant() restaurantId: string | null,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não vinculado a um restaurante');
    }

    return this.ordersService.getOrderStats(
      restaurantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ver detalhes do pedido' })
  @ApiResponse({ status: 200, description: 'Detalhes do pedido' })
  async getOrderById(
    @Param('id') id: string,
    @CurrentRestaurant() restaurantId: string | null,
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não vinculado a um restaurante');
    }

    return this.ordersService.getOrderById(id, restaurantId);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.KITCHEN, UserRole.WAITER)
  @ApiOperation({ summary: 'Atualizar status do pedido' })
  @ApiResponse({ status: 200, description: 'Pedido atualizado' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentRestaurant() restaurantId: string | null,
    @CurrentUser() user: any,
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não vinculado a um restaurante');
    }

    return this.ordersService.updateOrderStatus(id, restaurantId, dto, user.id);
  }

  @Patch(':orderId/items/:itemId/status')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.KITCHEN, UserRole.WAITER)
  @ApiOperation({ summary: 'Atualizar status do item' })
  @ApiResponse({ status: 200, description: 'Item atualizado' })
  async updateItemStatus(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateOrderItemStatusDto,
    @CurrentRestaurant() restaurantId: string | null,
    @CurrentUser() user: any,
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não vinculado a um restaurante');
    }

    return this.ordersService.updateItemStatus(
      orderId,
      itemId,
      restaurantId,
      dto,
      user.id,
    );
  }

  @Post(':id/cancel')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Cancelar pedido' })
  @ApiResponse({ status: 200, description: 'Pedido cancelado' })
  async cancelOrder(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @CurrentRestaurant() restaurantId: string | null,
    @CurrentUser() user: any,
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não vinculado a um restaurante');
    }

    return this.ordersService.cancelOrder(id, restaurantId, body.reason, user.id);
  }
}

