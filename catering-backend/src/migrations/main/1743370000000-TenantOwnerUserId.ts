import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

/** Links each workspace tenant to its primary caterer user (profile owner). */
export class TenantOwnerUserId1743370000000 implements MigrationInterface {
  name = 'TenantOwnerUserId1743370000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'tenants',
      new TableColumn({
        name: 'user_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
        isUnique: true,
      }),
    );

    await queryRunner.createForeignKey(
      'tenants',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // One caterer user per tenant in current model: copy membership → owner link.
    await queryRunner.query(`
      UPDATE \`tenants\` t
      SET t.\`user_id\` = (
        SELECT u.\`id\` FROM \`users\` u
        WHERE u.\`tenant_id\` = t.\`id\`
        ORDER BY u.\`created_at\` ASC
        LIMIT 1
      )
      WHERE EXISTS (SELECT 1 FROM \`users\` u2 WHERE u2.\`tenant_id\` = t.\`id\`)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('tenants');
    const fk = table?.foreignKeys.find((f) => f.columnNames.includes('user_id'));
    if (fk) {
      await queryRunner.dropForeignKey('tenants', fk);
    }
    await queryRunner.dropColumn('tenants', 'user_id');
  }
}
