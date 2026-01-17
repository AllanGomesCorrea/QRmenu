import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { MenuItemsController } from './menu-items.controller';
import { MenuItemsService } from './menu-items.service';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';

@Module({
  controllers: [CategoriesController, MenuItemsController, MenuController],
  providers: [CategoriesService, MenuItemsService, MenuService],
  exports: [CategoriesService, MenuItemsService, MenuService],
})
export class MenuModule {}
