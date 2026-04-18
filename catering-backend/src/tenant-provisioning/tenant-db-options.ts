import { ConfigService } from '@nestjs/config';
import type { DataSourceOptions } from 'typeorm';
import type { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { TENANT_TYPEORM_MIGRATIONS } from '../migrations/tenant/tenant-migrations.registry';
import { TENANT_TYPEORM_ENTITIES } from '../tenant-data/tenant-entities';

type TenantMysqlCore = Omit<MysqlConnectionOptions, 'database' | 'migrations'>;

export function tenantMysqlBaseOptions(config: ConfigService): TenantMysqlCore {
  return {
    type: 'mysql',
    host: config.get<string>('DB_HOST', '127.0.0.1'),
    port: Number(config.get<string>('DB_PORT', '3306')),
    username: config.get<string>('DB_USER', 'root'),
    password: config.get<string>('DB_PASSWORD', ''),
    entities: [...TENANT_TYPEORM_ENTITIES],
    synchronize: false,
    logging: config.get<string>('TYPEORM_LOGGING') === 'true',
  };
}

export function tenantMigrateDataSourceOptions(
  config: ConfigService,
  database: string,
): DataSourceOptions {
  const opts: MysqlConnectionOptions = {
    ...tenantMysqlBaseOptions(config),
    database,
    migrations: [...TENANT_TYPEORM_MIGRATIONS],
    migrationsTableName: 'migrations',
  };
  return opts;
}

export function tenantRuntimeDataSourceOptions(config: ConfigService, database: string): DataSourceOptions {
  const opts: MysqlConnectionOptions = {
    ...tenantMysqlBaseOptions(config),
    database,
  };
  return opts;
}
