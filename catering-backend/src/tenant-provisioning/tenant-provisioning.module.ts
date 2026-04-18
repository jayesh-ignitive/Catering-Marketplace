import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from '../tenant/tenant.entity';
import { TenantConnectionService } from './tenant-connection.service';
import { TenantProvisioningService } from './tenant-provisioning.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant])],
  providers: [TenantProvisioningService, TenantConnectionService],
  exports: [TenantProvisioningService, TenantConnectionService],
})
export class TenantProvisioningModule {}
