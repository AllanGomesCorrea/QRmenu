import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UserRole, TableStatus } from '@prisma/client';
import { TablesService } from './tables.service';
import { CreateTableDto, UpdateTableDto } from './dto';
import { Public, Roles } from '../common/decorators';
import { CurrentRestaurant } from '../common/decorators/current-restaurant.decorator';

@ApiTags('tables')
@Controller('tables')
@ApiBearerAuth()
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar mesas do restaurante' })
  @ApiResponse({ status: 200, description: 'Lista de mesas' })
  async findAll(@CurrentRestaurant() restaurantId: string | null) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.tablesService.findAll(restaurantId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obter estatísticas das mesas' })
  @ApiResponse({ status: 200, description: 'Estatísticas das mesas' })
  async getStats(@CurrentRestaurant() restaurantId: string | null) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.tablesService.getTableStats(restaurantId);
  }

  @Get('by-status')
  @ApiOperation({ summary: 'Listar mesas por status' })
  @ApiQuery({ name: 'status', enum: TableStatus })
  @ApiResponse({ status: 200, description: 'Mesas filtradas por status' })
  async getByStatus(
    @CurrentRestaurant() restaurantId: string | null,
    @Query('status') status: TableStatus,
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.tablesService.getTablesByStatus(restaurantId, status);
  }

  @Public()
  @Get('qr/:qrCode')
  @ApiOperation({ summary: 'Buscar mesa por QR Code (público)' })
  @ApiResponse({ status: 200, description: 'Dados da mesa' })
  @ApiResponse({ status: 404, description: 'Mesa não encontrada' })
  async findByQRCode(@Param('qrCode') qrCode: string) {
    return this.tablesService.findByQRCode(qrCode);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar mesa por ID' })
  @ApiResponse({ status: 200, description: 'Dados da mesa' })
  @ApiResponse({ status: 404, description: 'Mesa não encontrada' })
  async findById(
    @Param('id') id: string,
    @CurrentRestaurant() restaurantId: string | null,
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.tablesService.findById(id, restaurantId);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Criar nova mesa' })
  @ApiResponse({ status: 201, description: 'Mesa criada' })
  @ApiResponse({ status: 409, description: 'Número de mesa já existe' })
  async create(
    @CurrentRestaurant() restaurantId: string | null,
    @Body() dto: CreateTableDto,
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.tablesService.create(restaurantId, dto);
  }

  @Post('bulk')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Criar múltiplas mesas' })
  @ApiResponse({ status: 201, description: 'Mesas criadas' })
  async createBulk(
    @CurrentRestaurant() restaurantId: string | null,
    @Body() body: { count: number; section?: string },
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.tablesService.createBulk(restaurantId, body.count, body.section);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Atualizar mesa' })
  @ApiResponse({ status: 200, description: 'Mesa atualizada' })
  @ApiResponse({ status: 404, description: 'Mesa não encontrada' })
  async update(
    @Param('id') id: string,
    @CurrentRestaurant() restaurantId: string | null,
    @Body() dto: UpdateTableDto,
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.tablesService.update(id, restaurantId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Excluir mesa' })
  @ApiResponse({ status: 200, description: 'Mesa excluída' })
  @ApiResponse({ status: 404, description: 'Mesa não encontrada' })
  @ApiResponse({ status: 409, description: 'Mesa possui sessões ou pedidos' })
  async delete(
    @Param('id') id: string,
    @CurrentRestaurant() restaurantId: string | null,
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.tablesService.delete(id, restaurantId);
  }

  @Post(':id/activate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.WAITER)
  @ApiOperation({ summary: 'Ativar mesa para receber clientes' })
  @ApiResponse({ status: 200, description: 'Mesa ativada' })
  async activateTable(
    @Param('id') id: string,
    @CurrentRestaurant() restaurantId: string | null,
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.tablesService.activateTable(id, restaurantId);
  }

  @Post(':id/close')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.WAITER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Fechar mesa' })
  @ApiResponse({ status: 200, description: 'Mesa fechada' })
  async closeTable(
    @Param('id') id: string,
    @CurrentRestaurant() restaurantId: string | null,
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.tablesService.closeTable(id, restaurantId);
  }

  @Post(':id/release')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Liberar mesa após pagamento (disponível)' })
  @ApiResponse({ status: 200, description: 'Mesa liberada e disponível' })
  async releaseTable(
    @Param('id') id: string,
    @CurrentRestaurant() restaurantId: string | null,
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.tablesService.releaseTable(id, restaurantId);
  }

  @Post(':id/force-release')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Forçar liberação da mesa (cancela pedidos pendentes)' })
  @ApiResponse({ status: 200, description: 'Mesa forçosamente liberada' })
  @ApiResponse({ status: 404, description: 'Mesa não encontrada' })
  async forceReleaseTable(
    @Param('id') id: string,
    @CurrentRestaurant() restaurantId: string | null,
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.tablesService.forceReleaseTable(id, restaurantId);
  }

  @Get(':id/qrcode')
  @ApiOperation({ summary: 'Obter QR Code da mesa' })
  @ApiQuery({ name: 'format', enum: ['dataurl', 'svg'], required: false })
  @ApiResponse({ status: 200, description: 'QR Code da mesa' })
  async getQRCode(
    @Param('id') id: string,
    @CurrentRestaurant() restaurantId: string | null,
    @Query('format') format?: 'dataurl' | 'svg',
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.tablesService.getQRCode(id, restaurantId, format);
  }

  @Post(':id/regenerate-qr')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Regenerar QR Code da mesa' })
  @ApiResponse({ status: 200, description: 'QR Code regenerado' })
  async regenerateQRCode(
    @Param('id') id: string,
    @CurrentRestaurant() restaurantId: string | null,
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.tablesService.regenerateQRCode(id, restaurantId);
  }
}

