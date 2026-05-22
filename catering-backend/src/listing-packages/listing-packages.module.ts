import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Language } from '../localization/language.entity';
import { ListingPlanComparisonRowTranslation } from './listing-plan-comparison-row-translation.entity';
import { ListingPlanComparisonRow } from './listing-plan-comparison-row.entity';
import { ListingPlanTranslation } from './listing-plan-translation.entity';
import { ListingPlan } from './listing-plan.entity';
import { ListingPackagesPageTranslation } from './listing-packages-page-translation.entity';
import { ListingPackagesService } from './listing-packages.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ListingPackagesPageTranslation,
      ListingPlan,
      ListingPlanTranslation,
      ListingPlanComparisonRow,
      ListingPlanComparisonRowTranslation,
      Language,
    ]),
  ],
  providers: [ListingPackagesService],
  exports: [ListingPackagesService],
})
export class ListingPackagesModule {}
