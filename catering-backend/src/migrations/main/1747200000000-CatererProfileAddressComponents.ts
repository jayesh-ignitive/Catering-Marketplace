import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/** Split address into pincode, state, country, and formatted line on caterer_profiles. */
export class CatererProfileAddressComponents1747200000000 implements MigrationInterface {
  name = 'CatererProfileAddressComponents1747200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const cols = [
      new TableColumn({
        name: 'pincode',
        type: 'char',
        length: '6',
        isNullable: true,
      }),
      new TableColumn({
        name: 'state',
        type: 'varchar',
        length: '120',
        isNullable: true,
      }),
      new TableColumn({
        name: 'country',
        type: 'varchar',
        length: '120',
        isNullable: true,
      }),
      new TableColumn({
        name: 'formatted_address',
        type: 'varchar',
        length: '500',
        isNullable: true,
      }),
    ];

    for (const col of cols) {
      if (!(await queryRunner.hasColumn('caterer_profiles', col.name))) {
        await queryRunner.addColumn('caterer_profiles', col);
      }
    }

    // Best-effort backfill pincode from legacy combined street_address (MySQL 8+ / MariaDB 10.0.5+).
    await queryRunner.query(`
UPDATE \`caterer_profiles\`
SET \`pincode\` = REGEXP_SUBSTR(\`street_address\`, '[0-9]{6}')
WHERE \`pincode\` IS NULL
  AND \`street_address\` REGEXP '[0-9]{6}'
    `).catch(() => undefined);

    await queryRunner.query(`
UPDATE \`caterer_profiles\`
SET \`formatted_address\` = \`street_address\`
WHERE \`formatted_address\` IS NULL
  AND \`street_address\` IS NOT NULL
  AND TRIM(\`street_address\`) <> ''
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const name of [
      'formatted_address',
      'country',
      'state',
      'pincode',
    ]) {
      if (await queryRunner.hasColumn('caterer_profiles', name)) {
        await queryRunner.dropColumn('caterer_profiles', name);
      }
    }
  }
}
