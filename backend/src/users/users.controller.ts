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
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { Roles } from '../common/decorators';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';
import { CurrentRestaurant } from '../common/decorators/current-restaurant.decorator';

@ApiTags('users')
@Controller('users')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Listar usuários do restaurante' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de usuários' })
  async findAll(
    @CurrentRestaurant() restaurantId: string | null,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.usersService.findAll(restaurantId, page || 1, limit || 10);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  @ApiResponse({ status: 200, description: 'Dados do usuário' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async findById(
    @Param('id') id: string,
    @CurrentRestaurant() restaurantId: string | null,
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.usersService.findById(id, restaurantId);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado' })
  @ApiResponse({ status: 409, description: 'Email já existe' })
  async create(
    @CurrentRestaurant() restaurantId: string | null,
    @Body() dto: CreateUserDto,
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.usersService.create(restaurantId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar usuário' })
  @ApiResponse({ status: 200, description: 'Usuário atualizado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async update(
    @Param('id') id: string,
    @CurrentRestaurant() restaurantId: string | null,
    @Body() dto: UpdateUserDto,
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.usersService.update(id, restaurantId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Desativar usuário' })
  @ApiResponse({ status: 200, description: 'Usuário desativado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async delete(
    @Param('id') id: string,
    @CurrentRestaurant() restaurantId: string | null,
    @CurrentUser() user: CurrentUserData,
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('Usuário não está vinculado a um restaurante');
    }
    return this.usersService.delete(id, restaurantId, user.id);
  }
}

