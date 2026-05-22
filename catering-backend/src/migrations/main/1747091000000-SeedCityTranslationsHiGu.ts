import { MigrationInterface, QueryRunner } from 'typeorm';
import { CITY_I18N } from '../../marketplace/seeds/city-i18n.seed';

export class SeedCityTranslationsHiGu1747091000000 implements MigrationInterface {
  name = 'SeedCityTranslationsHiGu1747091000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const sql = `
      INSERT INTO \`city_translations\` (\`city_id\`, \`language_id\`, \`name\`)
      SELECT c.\`id\`, l.\`id\`, ?
      FROM \`cities\` c
      INNER JOIN \`languages\` l ON l.\`code\` = ?
      WHERE c.\`slug\` = ?
      ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`)
    `;

    for (const row of CITY_I18N) {
      await queryRunner.query(sql, [row.hi.name, 'hi', row.slug]);
      await queryRunner.query(sql, [row.gu.name, 'gu', row.slug]);
    }
  }

  public async down(): Promise<void> {
    /* Skipped — avoids deleting admin-edited hi/gu rows. */
  }
}
