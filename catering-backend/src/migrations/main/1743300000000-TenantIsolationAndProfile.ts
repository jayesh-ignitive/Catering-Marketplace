import { MigrationInterface, QueryRunner, Table, TableColumn } from 'typeorm';

/**
 * Platform database — tenant listing IDs, DB names, profile flags.
 * Idempotent: safe if a previous failed run left `platform_sequences` or some columns behind.
 */
export class TenantIsolationAndProfile1743300000000 implements MigrationInterface {
  name = 'TenantIsolationAndProfile1743300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'platform_sequences',
        columns: [
          { name: 'name', type: 'varchar', length: '64', isPrimary: true },
          { name: 'next_value', type: 'int', unsigned: true, isNullable: false },
        ],
      }),
      true,
    );
    await queryRunner.query(
      `INSERT IGNORE INTO \`platform_sequences\` (\`name\`, \`next_value\`) VALUES ('tenant_listing', 2000000)`,
    );

    const tenantCols: TableColumn[] = [
      new TableColumn({
        name: 'db_name',
        type: 'varchar',
        length: '64',
        isNullable: true,
        isUnique: true,
      }),
      new TableColumn({
        name: 'listing_id',
        type: 'int',
        unsigned: true,
        isNullable: true,
        isUnique: true,
      }),
      new TableColumn({
        name: 'provision_status',
        type: 'varchar',
        length: '16',
        isNullable: false,
        default: "'pending'",
      }),
      new TableColumn({
        name: 'profile_published',
        type: 'tinyint',
        width: 1,
        default: 0,
      }),
      new TableColumn({
        name: 'profile_options',
        type: 'json',
        isNullable: true,
      }),
    ];

    for (const col of tenantCols) {
      if (!(await queryRunner.hasColumn('tenants', col.name))) {
        await queryRunner.addColumn('tenants', col);
      }
    }

    const tenants = (await queryRunner.query(
      `SELECT \`id\` FROM \`tenants\` WHERE \`listing_id\` IS NULL`,
    )) as { id: string }[];

    for (const t of tenants) {
      await queryRunner.query(
        `UPDATE \`platform_sequences\` SET \`next_value\` = LAST_INSERT_ID(\`next_value\` + 1) WHERE \`name\` = 'tenant_listing'`,
      );
      const [row] = (await queryRunner.query(`SELECT LAST_INSERT_ID() AS lid`)) as { lid: number }[];
      const listingId = Number(row.lid);
      const dbName = `ct_${t.id.replace(/-/g, '')}`.slice(0, 64);
      await queryRunner.query(
        `UPDATE \`tenants\` SET \`listing_id\` = ?, \`db_name\` = ?, \`provision_status\` = 'pending' WHERE \`id\` = ?`,
        [listingId, dbName, t.id],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('tenants', 'profile_options')) {
      await queryRunner.dropColumn('tenants', 'profile_options');
    }
    if (await queryRunner.hasColumn('tenants', 'profile_published')) {
      await queryRunner.dropColumn('tenants', 'profile_published');
    }
    if (await queryRunner.hasColumn('tenants', 'provision_status')) {
      await queryRunner.dropColumn('tenants', 'provision_status');
    }
    if (await queryRunner.hasColumn('tenants', 'listing_id')) {
      await queryRunner.dropColumn('tenants', 'listing_id');
    }
    if (await queryRunner.hasColumn('tenants', 'db_name')) {
      await queryRunner.dropColumn('tenants', 'db_name');
    }
    await queryRunner.dropTable('platform_sequences', true);
  }
}
