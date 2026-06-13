import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/** Address line 1/2 and free-text city name from map geocoding. */
export class CatererProfileAddressLinesAndCityName1747400000000 implements MigrationInterface {
  name = 'CatererProfileAddressLinesAndCityName1747400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const cols = [
      new TableColumn({
        name: 'address_line_1',
        type: 'varchar',
        length: '200',
        isNullable: true,
      }),
      new TableColumn({
        name: 'address_line_2',
        type: 'varchar',
        length: '200',
        isNullable: true,
      }),
      new TableColumn({
        name: 'city_name',
        type: 'varchar',
        length: '120',
        isNullable: true,
      }),
    ];

    for (const col of cols) {
      if (!(await queryRunner.hasColumn('caterer_profiles', col.name))) {
        await queryRunner.addColumn('caterer_profiles', col);
      }
    }

    await queryRunner.query(`
UPDATE \`caterer_profiles\`
SET \`address_line_1\` = TRIM(\`street_address\`)
WHERE \`address_line_1\` IS NULL
  AND \`street_address\` IS NOT NULL
  AND TRIM(\`street_address\`) <> ''
    `);

    await queryRunner.query(`
UPDATE \`caterer_profiles\` cp
INNER JOIN \`cities\` c ON c.\`id\` = cp.\`city_id\`
SET cp.\`city_name\` = c.\`name\`
WHERE cp.\`city_name\` IS NULL
    `).catch(() => undefined);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const name of ['city_name', 'address_line_2', 'address_line_1']) {
      if (await queryRunner.hasColumn('caterer_profiles', name)) {
        await queryRunner.dropColumn('caterer_profiles', name);
      }
    }
  }
}
