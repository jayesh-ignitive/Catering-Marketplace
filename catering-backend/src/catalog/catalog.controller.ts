import { Controller, Get, Header, Query } from '@nestjs/common';
import { ListingPackagesService } from '../listing-packages/listing-packages.service';
import { CatalogService } from './catalog.service';

@Controller('catalog')
export class CatalogController {
  constructor(
    private readonly catalog: CatalogService,
    private readonly listingPackages: ListingPackagesService,
  ) {}

  @Get('cities')
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=60')
  getCities(@Query('locale') locale?: string) {
    return this.catalog.getCities(locale);
  }

  @Get('service-categories')
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=60')
  getCategories(@Query('locale') locale?: string) {
    return this.catalog.getServiceCategories(locale);
  }

  @Get('home-banners')
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=60')
  getHomeBanners() {
    return this.catalog.getHomeBanners();
  }

  @Get('listing-packages')
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=60')
  getListingPackages(@Query('locale') locale?: string) {
    return this.listingPackages.getPublicPage(locale);
  }

  @Get('stats')
  getStats() {
    return this.catalog.getStats();
  }

  @Get('search')
  search(
    @Query('cityId') cityId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('locale') locale?: string,
  ) {
    return this.catalog.search(cityId, categoryId, locale);
  }
}
