import { MigrationInterface, QueryRunner } from 'typeorm';

/** Removes `tenants.listing_id` and the `platform_sequences` table; public profiles use `slug` only. */
export class DropTenantListingIdAndPlatformSequences1743410000000 implements MigrationInterface {
  name = 'DropTenantListingIdAndPlatformSequences1743410000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('platform_sequences')) {
      await queryRunner.dropTable('platform_sequences', true);
    }
    if (await queryRunner.hasColumn('tenants', 'listing_id')) {
      await queryRunner.query(`ALTER TABLE \`tenants\` DROP COLUMN \`listing_id\``);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('platform_sequences'))) {
      await queryRunner.query(`
        CREATE TABLE \`platform_sequences\` (
          \`name\` varchar(64) NOT NULL,
          \`next_value\` bigint unsigned NOT NULL,
          PRIMARY KEY (\`name\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      await queryRunner.query(
        `INSERT INTO \`platform_sequences\` (\`name\`, \`next_value\`) VALUES ('tenant_listing', 2000000)`,
      );
    }
    if (!(await queryRunner.hasColumn('tenants', 'listing_id'))) {
      await queryRunner.query(
        `ALTER TABLE \`tenants\` ADD \`listing_id\` int unsigned NULL`,
      );
      await queryRunner.query(
        `CREATE UNIQUE INDEX \`IDX_tenants_listing_id\` ON \`tenants\` (\`listing_id\`)`,
      );
    }
  }
}
