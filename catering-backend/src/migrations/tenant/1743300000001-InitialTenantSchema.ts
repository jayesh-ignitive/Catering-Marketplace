import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Per-tenant database (one MySQL schema per caterer, e.g. `ct_<uuid>`).
 * Applied via `TenantProvisioningService` / TypeORM `runMigrations` on that DB only.
 * Do not register these in `src/data-source.ts` — CLI `migration:run` is main-DB only.
 */
export class InitialTenantSchema1743300000001 implements MigrationInterface {
  name = 'InitialTenantSchema1743300000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`menu_categories\` (
        \`id\` varchar(36) NOT NULL,
        \`name\` varchar(120) NOT NULL,
        \`sort_order\` int NOT NULL DEFAULT 0,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`menu_items\` (
        \`id\` varchar(36) NOT NULL,
        \`category_id\` varchar(36) NOT NULL,
        \`name\` varchar(200) NOT NULL,
        \`description\` text NULL,
        \`price\` decimal(12,2) NOT NULL DEFAULT 0,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_menu_items_category\` (\`category_id\`),
        CONSTRAINT \`FK_menu_items_category\` FOREIGN KEY (\`category_id\`) REFERENCES \`menu_categories\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`caterer_staff\` (
        \`id\` varchar(36) NOT NULL,
        \`full_name\` varchar(120) NOT NULL,
        \`title\` varchar(80) NULL,
        \`phone\` varchar(32) NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`orders\` (
        \`id\` varchar(36) NOT NULL,
        \`customer_name\` varchar(160) NOT NULL,
        \`status\` varchar(32) NOT NULL DEFAULT 'pending',
        \`total\` decimal(12,2) NOT NULL DEFAULT 0,
        \`placed_at\` datetime(6) NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`invoices\` (
        \`id\` varchar(36) NOT NULL,
        \`invoice_number\` varchar(40) NOT NULL,
        \`order_id\` varchar(36) NULL,
        \`amount\` decimal(12,2) NOT NULL,
        \`status\` varchar(24) NOT NULL DEFAULT 'draft',
        \`issued_at\` datetime(6) NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`UQ_invoices_invoice_number\` (\`invoice_number\`),
        INDEX \`IDX_invoices_order\` (\`order_id\`),
        CONSTRAINT \`FK_invoices_order\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`invoices\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`orders\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`caterer_staff\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`menu_items\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`menu_categories\``);
  }
}
