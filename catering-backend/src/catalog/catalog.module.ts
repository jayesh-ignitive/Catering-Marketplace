import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogController } from './blog.controller';
import { BlogPost } from './blog-post.entity';
import { BlogService } from './blog.service';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';

@Module({
  imports: [TypeOrmModule.forFeature([BlogPost])],
  controllers: [CatalogController, BlogController],
  providers: [CatalogService, BlogService],
  exports: [CatalogService],
})
export class CatalogModule {}
