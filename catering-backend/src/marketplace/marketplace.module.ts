import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantProvisioningModule } from '../tenant-provisioning/tenant-provisioning.module';
import { User } from '../user/user.entity';
import { Tenant } from '../tenant/tenant.entity';
import { CatererMarketplaceListing } from './caterer-marketplace-listing.entity';
import { CatererProfileCategory } from './caterer-profile-category.entity';
import { CatererProfileCuisine } from './caterer-profile-cuisine.entity';
import { CatererProfileGalleryImage } from './caterer-profile-gallery-image.entity';
import { CatererProfileKeyword } from './caterer-profile-keyword.entity';
import { CatererProfileServiceOffering } from './caterer-profile-service-offering.entity';
import { Category } from './category.entity';
import { Cuisine } from './cuisine.entity';
import { City } from './city.entity';
import { Country } from './country.entity';
import { CatererReview } from './caterer-review.entity';
import { Keyword } from './keyword.entity';
import { ServiceOffering } from './service-offering.entity';
import { State } from './state.entity';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';

@Module({
  imports: [
    TenantProvisioningModule,
    TypeOrmModule.forFeature([
      CatererMarketplaceListing,
      CatererReview,
      Tenant,
      User,
      Category,
      Country,
      State,
      City,
      CatererProfileCategory,
      CatererProfileGalleryImage,
      Cuisine,
      ServiceOffering,
      CatererProfileCuisine,
      CatererProfileServiceOffering,
      Keyword,
      CatererProfileKeyword,
    ]),
  ],
  controllers: [MarketplaceController],
  providers: [MarketplaceService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
