import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { Public } from '../common/decorators';

@ApiTags('public-menu')
@Controller('public/menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Obter cardápio completo do restaurante' })
  @ApiResponse({ status: 200, description: 'Cardápio do restaurante' })
  @ApiResponse({ status: 404, description: 'Restaurante não encontrado' })
  async getMenu(@Param('slug') slug: string) {
    return this.menuService.getMenuBySlug(slug);
  }

  @Public()
  @Get(':slug/item/:itemId')
  @ApiOperation({ summary: 'Obter detalhes de um item' })
  @ApiResponse({ status: 200, description: 'Detalhes do item' })
  @ApiResponse({ status: 404, description: 'Item não encontrado' })
  async getItem(
    @Param('slug') slug: string,
    @Param('itemId') itemId: string,
  ) {
    return this.menuService.getItemBySlugAndId(slug, itemId);
  }

  @Public()
  @Get(':slug/search')
  @ApiOperation({ summary: 'Buscar itens no cardápio' })
  @ApiQuery({ name: 'q', description: 'Termo de busca' })
  @ApiResponse({ status: 200, description: 'Resultados da busca' })
  async searchItems(
    @Param('slug') slug: string,
    @Query('q') query: string,
  ) {
    return this.menuService.searchItems(slug, query || '');
  }

  @Public()
  @Get(':slug/filter')
  @ApiOperation({ summary: 'Filtrar itens por dieta' })
  @ApiQuery({ name: 'vegan', required: false, type: Boolean })
  @ApiQuery({ name: 'vegetarian', required: false, type: Boolean })
  @ApiQuery({ name: 'glutenFree', required: false, type: Boolean })
  @ApiQuery({ name: 'spicy', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Itens filtrados' })
  async filterItems(
    @Param('slug') slug: string,
    @Query('vegan') vegan?: boolean,
    @Query('vegetarian') vegetarian?: boolean,
    @Query('glutenFree') glutenFree?: boolean,
    @Query('spicy') spicy?: boolean,
  ) {
    return this.menuService.getItemsByFilter(slug, {
      isVegan: vegan,
      isVegetarian: vegetarian,
      isGlutenFree: glutenFree,
      isSpicy: spicy,
    });
  }
}

