import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ContactSubmission } from '../contact/contact-submission.entity';
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
import { Category } from '../marketplace/category.entity';
import { CatererMarketplaceListing } from '../marketplace/caterer-marketplace-listing.entity';
import { CatererReview } from '../marketplace/caterer-review.entity';
import { ServiceCategoriesModule } from '../marketplace/service-categories.module';
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
import { AdminServiceCategoriesController } from './admin-service-categories.controller';
import { AdminServiceCategoriesService } from './admin-service-categories.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [
    AuthModule,
    ServiceCategoriesModule,
    TypeOrmModule.forFeature([
      User,
      Tenant,
      ContactSubmission,
      Category,
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
    RolesGuard,
  ],
})
export class AdminModule {}
