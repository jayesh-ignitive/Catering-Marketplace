import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Tenant } from '../tenant/tenant.entity';
import { tenantMigrateDataSourceOptions } from './tenant-db-options';

@Injectable()
export class TenantProvisioningService {
  private readonly log = new Logger(TenantProvisioningService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectDataSource()
    private readonly mainDs: DataSource,
    @InjectRepository(Tenant)
    private readonly tenants: Repository<Tenant>,
  ) {}

  async provisionTenant(tenantId: string): Promise<void> {
    const tenant = await this.tenants.findOne({ where: { id: tenantId } });
    if (!tenant?.dbName) {
      this.log.warn(`Tenant ${tenantId} has no db_name; skip provisioning`);
      return;
    }
    if (tenant.provisionStatus === 'ready') {
      return;
    }

    try {
      await this.mainDs.query(
        `CREATE DATABASE IF NOT EXISTS \`${tenant.dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
      );
      const opts = tenantMigrateDataSourceOptions(this.config, tenant.dbName);
      const tenantDs = new DataSource(opts);
      await tenantDs.initialize();
      await tenantDs.runMigrations();
      await tenantDs.destroy();

      tenant.provisionStatus = 'ready';
      await this.tenants.save(tenant);
      this.log.log(`Tenant DB ready: ${tenant.dbName}`);
    } catch (e) {
      this.log.error(`Provisioning failed for ${tenant.dbName}`, e);
      tenant.provisionStatus = 'failed';
      await this.tenants.save(tenant);
      throw e;
    }
  }

  /** Ensures caterer's isolated DB exists (retries after register or failed runs). */
  async ensureTenantDataReady(tenantId: string): Promise<void> {
    const tenant = await this.tenants.findOne({ where: { id: tenantId } });
    if (!tenant?.dbName) {
      return;
    }
    if (tenant.provisionStatus === 'ready') {
      return;
    }
    await this.provisionTenant(tenantId);
  }
}
