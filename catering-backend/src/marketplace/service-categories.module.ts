import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryTranslation } from './category-translation.entity';
import { Category } from './category.entity';
import { ServiceCategoriesService } from './service-categories.service';

@Module({
  imports: [TypeOrmModule.forFeature([Category, CategoryTranslation])],
  providers: [ServiceCategoriesService],
  exports: [ServiceCategoriesService],
})
export class ServiceCategoriesModule {}
