import {
  Controller,
  Get,
  Patch,
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
import { UserRole } from '@prisma/client';
import { RestaurantsService } from './restaurants.service';
import { UpdateRestaurantDto } from './dto';
import { Public, Roles } from '../common/decorators';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';
import { CurrentRestaurant } from '../common/decorators/current-restaurant.decorator';

@ApiTags('restaurants')
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'Listar restaurantes ativos (público)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'city', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Lista de restaurantes' })
  async findAllPublic(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('city') city?: string,
  ) {
    return this.restaurantsService.findAllPublic(page || 1, limit || 20, search, city);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Buscar restaurante por slug (público)' })
  @ApiResponse({ status: 200, description: 'Dados do restaurante' })
  @ApiResponse({ status: 404, description: 'Restaurante não encontrado' })
  async findBySlug(@Param('slug') slug: string) {
    return this.restaurantsService.findBySlug(slug);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter dados do restaurante do usuário logado' })
  @ApiResponse({ status: 200, description: 'Dados do restaurante' })
  @ApiResponse({ status: 404, description: 'Restaurante não encontrado' })
  async findMine(@CurrentRestaurant() restaurantId: string | null) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.restaurantsService.findMine(restaurantId);
  }

  @Patch('me')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Atualizar dados do restaurante' })
  @ApiResponse({ status: 200, description: 'Restaurante atualizado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  async update(
    @CurrentRestaurant() restaurantId: string | null,
    @Body() dto: UpdateRestaurantDto,
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.restaurantsService.update(restaurantId, dto);
  }

  @Get('me/stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter estatísticas do restaurante' })
  @ApiResponse({ status: 200, description: 'Estatísticas do restaurante' })
  async getStats(@CurrentRestaurant() restaurantId: string | null) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.restaurantsService.getStats(restaurantId);
  }

  // Super Admin only
  @Get()
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Listar todos os restaurantes (Super Admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Lista de restaurantes' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.restaurantsService.findAll(page || 1, limit || 10, search);
  }

  @Get(':id')
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Buscar restaurante por ID (Super Admin)' })
  @ApiResponse({ status: 200, description: 'Dados do restaurante' })
  @ApiResponse({ status: 404, description: 'Restaurante não encontrado' })
  async findById(@Param('id') id: string) {
    return this.restaurantsService.findById(id);
  }
}

