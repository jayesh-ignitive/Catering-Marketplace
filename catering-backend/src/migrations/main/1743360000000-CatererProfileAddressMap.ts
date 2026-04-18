import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/** Address + coordinates for maps (listing & profile pages). */
export class CatererProfileAddressMap1743360000000 implements MigrationInterface {
  name = 'CatererProfileAddressMap1743360000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const cols = [
      new TableColumn({
        name: 'street_address',
        type: 'varchar',
        length: '300',
        isNullable: true,
      }),
      new TableColumn({
        name: 'latitude',
        type: 'decimal',
        precision: 10,
        scale: 7,
        isNullable: true,
      }),
      new TableColumn({
        name: 'longitude',
        type: 'decimal',
        precision: 11,
        scale: 7,
        isNullable: true,
      }),
    ];

    for (const col of cols) {
      if (!(await queryRunner.hasColumn('caterer_profiles', col.name))) {
        await queryRunner.addColumn('caterer_profiles', col);
      }
    }

    // Demo coordinates around Ahmedabad + synthetic street lines (ahm-demo tenants only).
    await queryRunner.query(`
UPDATE \`caterer_profiles\` cp
INNER JOIN \`tenants\` t ON t.\`id\` = cp.\`tenant_id\`
SET
  cp.\`street_address\` = CONCAT(
    ELT(
      1 + (CRC32(t.\`id\`) MOD 10),
      '101, Satellite Road',
      '45, Vastrapur Main Road',
      'Block C, Navrangpura Society',
      'Near Iskcon Bridge, SG Highway',
      '12, CG Road',
      'Maninagar Station Road',
      'Bopal–Ghuma Road',
      'Science City Road',
      'Riverfront promenade area',
      'Gift City Link Road'
    ),
    ', Ahmedabad, Gujarat'
  ),
  cp.\`latitude\` = 22.9800 + (CRC32(CONCAT(t.\`id\`, 'la')) MOD 1700) / 100000.0,
  cp.\`longitude\` = 72.4800 + (CRC32(CONCAT(t.\`id\`, 'ln')) MOD 2000) / 100000.0
WHERE t.\`slug\` LIKE 'ahm-demo-%'
  AND (cp.\`latitude\` IS NULL OR cp.\`longitude\` IS NULL OR cp.\`street_address\` IS NULL)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('caterer_profiles', 'longitude')) {
      await queryRunner.dropColumn('caterer_profiles', 'longitude');
    }
    if (await queryRunner.hasColumn('caterer_profiles', 'latitude')) {
      await queryRunner.dropColumn('caterer_profiles', 'latitude');
    }
    if (await queryRunner.hasColumn('caterer_profiles', 'street_address')) {
      await queryRunner.dropColumn('caterer_profiles', 'street_address');
    }
  }
}
