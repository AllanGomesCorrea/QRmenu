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
import { UserRole } from '@prisma/client';
import { MenuItemsService } from './menu-items.service';
import { CreateMenuItemDto, UpdateMenuItemDto } from './dto';
import { Roles } from '../common/decorators';
import { CurrentRestaurant } from '../common/decorators/current-restaurant.decorator';

@ApiTags('menu')
@Controller('menu/items')
@ApiBearerAuth()
export class MenuItemsController {
  constructor(private readonly menuItemsService: MenuItemsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar itens do cardápio' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'availableOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'featuredOnly', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Lista de itens' })
  async findAll(
    @CurrentRestaurant() restaurantId: string | null,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
    @Query('availableOnly') availableOnly?: boolean,
    @Query('featuredOnly') featuredOnly?: boolean,
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.menuItemsService.findAll(restaurantId, {
      categoryId,
      search,
      availableOnly,
      featuredOnly,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar item por ID' })
  @ApiResponse({ status: 200, description: 'Dados do item' })
  @ApiResponse({ status: 404, description: 'Item não encontrado' })
  async findById(
    @Param('id') id: string,
    @CurrentRestaurant() restaurantId: string | null,
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.menuItemsService.findById(id, restaurantId);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Criar novo item' })
  @ApiResponse({ status: 201, description: 'Item criado' })
  @ApiResponse({ status: 400, description: 'Categoria não encontrada' })
  async create(
    @CurrentRestaurant() restaurantId: string | null,
    @Body() dto: CreateMenuItemDto,
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.menuItemsService.create(restaurantId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Atualizar item' })
  @ApiResponse({ status: 200, description: 'Item atualizado' })
  @ApiResponse({ status: 404, description: 'Item não encontrado' })
  async update(
    @Param('id') id: string,
    @CurrentRestaurant() restaurantId: string | null,
    @Body() dto: UpdateMenuItemDto,
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.menuItemsService.update(id, restaurantId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Excluir item' })
  @ApiResponse({ status: 200, description: 'Item excluído' })
  @ApiResponse({ status: 404, description: 'Item não encontrado' })
  async delete(
    @Param('id') id: string,
    @CurrentRestaurant() restaurantId: string | null,
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.menuItemsService.delete(id, restaurantId);
  }

  @Patch(':id/toggle-availability')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.KITCHEN)
  @ApiOperation({ summary: 'Alternar disponibilidade do item' })
  @ApiResponse({ status: 200, description: 'Disponibilidade alterada' })
  async toggleAvailability(
    @Param('id') id: string,
    @CurrentRestaurant() restaurantId: string | null,
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.menuItemsService.toggleAvailability(id, restaurantId);
  }

  @Patch(':id/toggle-featured')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Alternar destaque do item' })
  @ApiResponse({ status: 200, description: 'Destaque alterado' })
  async toggleFeatured(
    @Param('id') id: string,
    @CurrentRestaurant() restaurantId: string | null,
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.menuItemsService.toggleFeatured(id, restaurantId);
  }

  @Post('reorder')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Reordenar itens de uma categoria' })
  @ApiResponse({ status: 200, description: 'Itens reordenados' })
  async reorder(
    @CurrentRestaurant() restaurantId: string | null,
    @Body() body: { categoryId: string; itemIds: string[] },
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.menuItemsService.reorder(
      restaurantId,
      body.categoryId,
      body.itemIds,
    );
  }
}

