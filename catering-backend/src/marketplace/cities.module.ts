import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Language } from '../localization/language.entity';
import { CityTranslation } from './city-translation.entity';
import { City } from './city.entity';
import { Country } from './country.entity';
import { CitiesService } from './cities.service';
import { State } from './state.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      City,
      CityTranslation,
      State,
      Country,
      Language,
    ]),
  ],
  providers: [CitiesService],
  exports: [CitiesService],
})
export class CitiesModule {}
