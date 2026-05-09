import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ContactSubmission } from '../contact/contact-submission.entity';
import { MenuCategoryTranslation } from '../catalog/menu-category-translation.entity';
import { MenuCategory } from '../catalog/menu-category.entity';
import { Language } from '../localization/language.entity';
import { CatererMarketplaceListing } from '../marketplace/caterer-marketplace-listing.entity';
import { CatererReview } from '../marketplace/caterer-review.entity';
import { Tenant } from '../tenant/tenant.entity';
import { User } from '../user/user.entity';
import { AdminCaterersController } from './admin-caterers.controller';
import { AdminCaterersService } from './admin-caterers.service';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminLanguagesController } from './admin-languages.controller';
import { AdminLanguagesService } from './admin-languages.service';
import { AdminMenuCategoriesController } from './admin-menu-categories.controller';
import { AdminMenuCategoriesService } from './admin-menu-categories.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      User,
      Tenant,
      ContactSubmission,
      CatererMarketplaceListing,
      CatererReview,
      Language,
      MenuCategory,
      MenuCategoryTranslation,
    ]),
  ],
  controllers: [
    AdminDashboardController,
    AdminUsersController,
    AdminCaterersController,
    AdminLanguagesController,
    AdminMenuCategoriesController,
  ],
  providers: [
    AdminDashboardService,
    AdminUsersService,
    AdminCaterersService,
    AdminLanguagesService,
    AdminMenuCategoriesService,
    RolesGuard,
  ],
})
export class AdminModule {}
