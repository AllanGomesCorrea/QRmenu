import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { Roles } from '../common/decorators';
import { CurrentRestaurant } from '../common/decorators/current-restaurant.decorator';

@ApiTags('menu')
@Controller('menu/categories')
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar categorias do cardápio' })
  @ApiResponse({ status: 200, description: 'Lista de categorias' })
  async findAll(@CurrentRestaurant() restaurantId: string | null) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.categoriesService.findAll(restaurantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar categoria por ID' })
  @ApiResponse({ status: 200, description: 'Dados da categoria' })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  async findById(
    @Param('id') id: string,
    @CurrentRestaurant() restaurantId: string | null,
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.categoriesService.findById(id, restaurantId);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Criar nova categoria' })
  @ApiResponse({ status: 201, description: 'Categoria criada' })
  @ApiResponse({ status: 409, description: 'Nome já existe' })
  async create(
    @CurrentRestaurant() restaurantId: string | null,
    @Body() dto: CreateCategoryDto,
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.categoriesService.create(restaurantId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Atualizar categoria' })
  @ApiResponse({ status: 200, description: 'Categoria atualizada' })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  async update(
    @Param('id') id: string,
    @CurrentRestaurant() restaurantId: string | null,
    @Body() dto: UpdateCategoryDto,
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.categoriesService.update(id, restaurantId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Excluir categoria' })
  @ApiResponse({ status: 200, description: 'Categoria excluída' })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  @ApiResponse({ status: 409, description: 'Categoria possui itens' })
  async delete(
    @Param('id') id: string,
    @CurrentRestaurant() restaurantId: string | null,
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.categoriesService.delete(id, restaurantId);
  }

  @Post('reorder')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Reordenar categorias' })
  @ApiResponse({ status: 200, description: 'Categorias reordenadas' })
  async reorder(
    @CurrentRestaurant() restaurantId: string | null,
    @Body() body: { categoryIds: string[] },
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.categoriesService.reorder(restaurantId, body.categoryIds);
  }
}

