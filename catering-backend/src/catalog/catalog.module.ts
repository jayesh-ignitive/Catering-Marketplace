import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../storage/storage.module';
import { CitiesModule } from '../marketplace/cities.module';
import { HomeBannersModule } from '../marketplace/home-banners.module';
import { ListingPackagesModule } from '../listing-packages/listing-packages.module';
import { ServiceCategoriesModule } from '../marketplace/service-categories.module';
import { BlogController } from './blog.controller';
import { BlogPost } from './blog-post.entity';
import { BlogService } from './blog.service';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([BlogPost]),
    StorageModule,
    ServiceCategoriesModule,
    CitiesModule,
    HomeBannersModule,
    ListingPackagesModule,
  ],
  controllers: [CatalogController, BlogController],
  providers: [CatalogService, BlogService],
  exports: [CatalogService, BlogService],
})
export class CatalogModule {}
