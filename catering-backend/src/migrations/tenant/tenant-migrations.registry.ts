import type { MigrationInterface } from 'typeorm';
import { InitialTenantSchema1743300000001 } from './1743300000001-InitialTenantSchema';

/**
 * Ordered migrations executed against each caterer's isolated database.
 * Add new tenant migrations here and bump timestamps in filenames.
 * Keep in sync with entities under `src/tenant-data/entities/`.
 */
export const TENANT_TYPEORM_MIGRATIONS: (new () => MigrationInterface)[] = [
  InitialTenantSchema1743300000001,
];
