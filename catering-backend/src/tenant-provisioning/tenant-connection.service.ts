import { Injectable, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Tenant } from '../tenant/tenant.entity';
import { tenantRuntimeDataSourceOptions } from './tenant-db-options';

@Injectable()
export class TenantConnectionService implements OnModuleDestroy {
  private readonly cache = new Map<string, DataSource>();

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Tenant)
    private readonly tenants: Repository<Tenant>,
  ) {}

  async getDataSource(tenantId: string): Promise<DataSource> {
    const existing = this.cache.get(tenantId);
    if (existing?.isInitialized) {
      return existing;
    }

    const tenant = await this.tenants.findOne({ where: { id: tenantId } });
    if (!tenant?.dbName || tenant.provisionStatus !== 'ready') {
      throw new ServiceUnavailableException(
        'Your catering workspace database is not ready yet. Try again in a moment.',
      );
    }

    const opts = tenantRuntimeDataSourceOptions(this.config, tenant.dbName);
    const ds = new DataSource(opts);
    await ds.initialize();
    this.cache.set(tenantId, ds);
    return ds;
  }

  async onModuleDestroy(): Promise<void> {
    for (const ds of this.cache.values()) {
      if (ds.isInitialized) {
        await ds.destroy();
      }
    }
    this.cache.clear();
  }
}
