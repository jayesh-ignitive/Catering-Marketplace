import { Controller, Get, Header, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('cities')
  getCities() {
    return this.catalog.getCities();
  }

  @Get('service-categories')
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=60')
  getCategories() {
    return this.catalog.getServiceCategories();
  }

  @Get('home-banners')
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=60')
  getHomeBanners() {
    return this.catalog.getHomeBanners();
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
