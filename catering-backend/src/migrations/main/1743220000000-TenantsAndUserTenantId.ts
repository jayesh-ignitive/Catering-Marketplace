import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

/** Platform database — tenant registry (metadata); business data lives in per-tenant DBs. */
export class TenantsAndUserTenantId1743220000000 implements MigrationInterface {
  name = 'TenantsAndUserTenantId1743220000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tenants',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'name', type: 'varchar', length: '120' },
          { name: 'slug', type: 'varchar', length: '80', isUnique: true },
          {
            name: 'created_at',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
            onUpdate: 'CURRENT_TIMESTAMP(6)',
          },
        ],
      }),
    );

    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`tenant_id\` varchar(36) NULL`,
    );

    await queryRunner.createForeignKey(
      'users',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedTableName: 'tenants',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');
    const fk = table?.foreignKeys.find((f) => f.columnNames.includes('tenant_id'));
    if (fk) {
      await queryRunner.dropForeignKey('users', fk);
    }
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`tenant_id\``);
    await queryRunner.dropTable('tenants');
  }
}
