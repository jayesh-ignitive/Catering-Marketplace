import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { CatererMarketplaceListing } from './marketplace/caterer-marketplace-listing.entity';
import { CatererProfileCategory } from './marketplace/caterer-profile-category.entity';
import { CatererProfileCuisine } from './marketplace/caterer-profile-cuisine.entity';
import { CatererProfileGalleryImage } from './marketplace/caterer-profile-gallery-image.entity';
import { CatererProfileKeyword } from './marketplace/caterer-profile-keyword.entity';
import { CatererProfileServiceOffering } from './marketplace/caterer-profile-service-offering.entity';
import { Category } from './marketplace/category.entity';
import { Cuisine } from './marketplace/cuisine.entity';
import { City } from './marketplace/city.entity';
import { Country } from './marketplace/country.entity';
import { Keyword } from './marketplace/keyword.entity';
import { CatererReview } from './marketplace/caterer-review.entity';
import { ServiceOffering } from './marketplace/service-offering.entity';
import { State } from './marketplace/state.entity';
import { Tenant } from './tenant/tenant.entity';
import { User } from './user/user.entity';

config({ path: '.env' });

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? 'root',
  database: process.env.DB_NAME ?? 'catering',
  synchronize: false,
  logging: process.env.TYPEORM_LOGGING === 'true',
  entities: [
    User,
    Tenant,
    CatererMarketplaceListing,
    CatererReview,
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
  ],
  /** Platform DB only — per-tenant migrations live in `migrations/tenant/` and run in app code. */
  migrations: ['src/migrations/main/*.ts'],
  migrationsTableName: 'migrations',
});

export default AppDataSource;
