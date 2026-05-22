import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CityTranslation } from './city-translation.entity';
import { City } from './city.entity';
import { CitiesService } from './cities.service';

@Module({
  imports: [TypeOrmModule.forFeature([City, CityTranslation])],
  providers: [CitiesService],
  exports: [CitiesService],
})
export class CitiesModule {}
