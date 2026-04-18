import { Controller, Get, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('cities')
  getCities() {
    return this.catalog.getCities();
  }

  @Get('service-categories')
  getCategories() {
    return this.catalog.getServiceCategories();
  }

  @Get('stats')
  getStats() {
    return this.catalog.getStats();
  }

  @Get('search')
  search(
    @Query('cityId') cityId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.catalog.search(cityId, categoryId);
  }
}
