import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { ServiceCategoriesService } from './service-categories.service';

@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  providers: [ServiceCategoriesService],
  exports: [ServiceCategoriesService],
})
export class ServiceCategoriesModule {}
