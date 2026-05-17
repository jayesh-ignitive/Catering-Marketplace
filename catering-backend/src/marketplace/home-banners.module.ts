import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../storage/storage.module';
import { HomeBanner } from './home-banner.entity';
import { HomeBannersService } from './home-banners.service';

@Module({
  imports: [TypeOrmModule.forFeature([HomeBanner]), StorageModule],
  providers: [HomeBannersService],
  exports: [HomeBannersService],
})
export class HomeBannersModule {}
