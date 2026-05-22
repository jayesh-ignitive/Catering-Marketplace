import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ContactSubmission } from '../contact/contact-submission.entity';
import { BlogPost } from '../catalog/blog-post.entity';
import { CatalogModule } from '../catalog/catalog.module';
import { AttributeTranslation } from '../catalog/attribute-translation.entity';
import { Attribute } from '../catalog/attribute.entity';
import { IngredientCategoryTranslation } from '../catalog/ingredient-category-translation.entity';
import { IngredientCategory } from '../catalog/ingredient-category.entity';
import { IngredientTranslation } from '../catalog/ingredient-translation.entity';
import { Ingredient } from '../catalog/ingredient.entity';
import { MenuCategoryTranslation } from '../catalog/menu-category-translation.entity';
import { MenuCategory } from '../catalog/menu-category.entity';
import { MenuItemAttribute } from '../catalog/menu-item-attribute.entity';
import { MenuItemIngredient } from '../catalog/menu-item-ingredient.entity';
import { MenuItemTranslation } from '../catalog/menu-item-translation.entity';
import { MenuItem } from '../catalog/menu-item.entity';
import { Language } from '../localization/language.entity';
import { LegalPageTranslation } from '../legal/legal-page-translation.entity';
import { LegalPage } from '../legal/legal-page.entity';
import { ListingPlanComparisonRowTranslation } from '../listing-packages/listing-plan-comparison-row-translation.entity';
import { ListingPlanComparisonRow } from '../listing-packages/listing-plan-comparison-row.entity';
import { ListingPlanTranslation } from '../listing-packages/listing-plan-translation.entity';
import { ListingPlan } from '../listing-packages/listing-plan.entity';
import { ListingPackagesPageTranslation } from '../listing-packages/listing-packages-page-translation.entity';
import { ListingPackagesModule } from '../listing-packages/listing-packages.module';
import { CitiesModule } from '../marketplace/cities.module';
import { CityTranslation } from '../marketplace/city-translation.entity';
import { City } from '../marketplace/city.entity';
import { CategoryTranslation } from '../marketplace/category-translation.entity';
import { Category } from '../marketplace/category.entity';
import { State } from '../marketplace/state.entity';
import { CatererMarketplaceListing } from '../marketplace/caterer-marketplace-listing.entity';
import { CatererReview } from '../marketplace/caterer-review.entity';
import { HomeBanner } from '../marketplace/home-banner.entity';
import { HomeBannersModule } from '../marketplace/home-banners.module';
import { MarketplaceModule } from '../marketplace/marketplace.module';
import { ServiceCategoriesModule } from '../marketplace/service-categories.module';
import { StorageModule } from '../storage/storage.module';
import { Tenant } from '../tenant/tenant.entity';
import { User } from '../user/user.entity';
import { AdminCaterersController } from './admin-caterers.controller';
import { AdminCaterersService } from './admin-caterers.service';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminLanguagesController } from './admin-languages.controller';
import { AdminLanguagesService } from './admin-languages.service';
import { AdminAttributesController } from './admin-attributes.controller';
import { AdminAttributesService } from './admin-attributes.service';
import { AdminIngredientCategoriesController } from './admin-ingredient-categories.controller';
import { AdminIngredientCategoriesService } from './admin-ingredient-categories.service';
import { AdminIngredientsController } from './admin-ingredients.controller';
import { AdminIngredientsService } from './admin-ingredients.service';
import { AdminMenuCategoriesController } from './admin-menu-categories.controller';
import { AdminMenuCategoriesService } from './admin-menu-categories.service';
import { AdminMenuItemsController } from './admin-menu-items.controller';
import { AdminMenuItemsService } from './admin-menu-items.service';
import { AdminBlogPostsController } from './admin-blog-posts.controller';
import { AdminBlogPostsService } from './admin-blog-posts.service';
import { AdminContactSubmissionsController } from './admin-contact-submissions.controller';
import { AdminContactSubmissionsService } from './admin-contact-submissions.service';
import { AdminHomeBannersController } from './admin-home-banners.controller';
import { AdminHomeBannersService } from './admin-home-banners.service';
import { AdminLegalPagesController } from './admin-legal-pages.controller';
import { AdminLegalPagesService } from './admin-legal-pages.service';
import { AdminListingPackagesController } from './admin-listing-packages.controller';
import { AdminListingPackagesService } from './admin-listing-packages.service';
import { AdminCitiesController } from './admin-cities.controller';
import { AdminCitiesService } from './admin-cities.service';
import { AdminServiceCategoriesController } from './admin-service-categories.controller';
import { AdminServiceCategoriesService } from './admin-service-categories.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [
    AuthModule,
    StorageModule,
    ServiceCategoriesModule,
    CitiesModule,
    HomeBannersModule,
    MarketplaceModule,
    CatalogModule,
    ListingPackagesModule,
    TypeOrmModule.forFeature([
      BlogPost,
      User,
      Tenant,
      ContactSubmission,
      Category,
      CategoryTranslation,
      City,
      CityTranslation,
      State,
      HomeBanner,
      CatererMarketplaceListing,
      CatererReview,
      Language,
      MenuCategory,
      MenuCategoryTranslation,
      IngredientCategory,
      IngredientCategoryTranslation,
      Ingredient,
      IngredientTranslation,
      MenuItem,
      MenuItemTranslation,
      MenuItemIngredient,
      MenuItemAttribute,
      Attribute,
      AttributeTranslation,
      LegalPage,
      LegalPageTranslation,
      ListingPackagesPageTranslation,
      ListingPlan,
      ListingPlanTranslation,
      ListingPlanComparisonRow,
      ListingPlanComparisonRowTranslation,
    ]),
  ],
  controllers: [
    AdminDashboardController,
    AdminUsersController,
    AdminCaterersController,
    AdminLanguagesController,
    AdminMenuCategoriesController,
    AdminIngredientCategoriesController,
    AdminIngredientsController,
    AdminMenuItemsController,
    AdminAttributesController,
    AdminServiceCategoriesController,
    AdminCitiesController,
    AdminHomeBannersController,
    AdminBlogPostsController,
    AdminContactSubmissionsController,
    AdminLegalPagesController,
    AdminListingPackagesController,
  ],
  providers: [
    AdminDashboardService,
    AdminUsersService,
    AdminCaterersService,
    AdminLanguagesService,
    AdminMenuCategoriesService,
    AdminIngredientCategoriesService,
    AdminIngredientsService,
    AdminMenuItemsService,
    AdminAttributesService,
    AdminServiceCategoriesService,
    AdminCitiesService,
    AdminHomeBannersService,
    AdminBlogPostsService,
    AdminContactSubmissionsService,
    AdminLegalPagesService,
    AdminListingPackagesService,
    RolesGuard,
  ],
})
export class AdminModule {}
