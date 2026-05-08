import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ContactSubmission } from '../contact/contact-submission.entity';
import { CatererMarketplaceListing } from '../marketplace/caterer-marketplace-listing.entity';
import { CatererReview } from '../marketplace/caterer-review.entity';
import { Tenant } from '../tenant/tenant.entity';
import { User } from '../user/user.entity';
import { AdminCaterersController } from './admin-caterers.controller';
import { AdminCaterersService } from './admin-caterers.service';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
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
    ]),
  ],
  controllers: [AdminDashboardController, AdminUsersController, AdminCaterersController],
  providers: [AdminDashboardService, AdminUsersService, AdminCaterersService, RolesGuard],
})
export class AdminModule {}
