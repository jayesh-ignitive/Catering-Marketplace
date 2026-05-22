import { MigrationInterface, QueryRunner } from 'typeorm';
import { SERVICE_CATEGORY_I18N } from '../../marketplace/seeds/service-category-i18n.seed';

export class SeedServiceCategoryTranslationsHiGu1747080000000
  implements MigrationInterface
{
  name = 'SeedServiceCategoryTranslationsHiGu1747080000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const sql = `
      INSERT INTO \`category_translations\`
        (\`category_id\`, \`language_id\`, \`name\`, \`short_description\`)
      SELECT c.\`id\`, l.\`id\`, ?, ?
      FROM \`categories\` c
      INNER JOIN \`languages\` l ON l.\`code\` = ?
      WHERE c.\`code\` = ?
      ON DUPLICATE KEY UPDATE
        \`name\` = VALUES(\`name\`),
        \`short_description\` = VALUES(\`short_description\`)
    `;

    for (const row of SERVICE_CATEGORY_I18N) {
      await queryRunner.query(sql, [
        row.hi.name,
        row.hi.shortDescription,
        'hi',
        row.code,
      ]);
      await queryRunner.query(sql, [
        row.gu.name,
        row.gu.shortDescription,
        'gu',
        row.code,
      ]);
    }
  }

  public async down(): Promise<void> {
    /* Skipped — avoids deleting admin-edited hi/gu rows. */
  }
}
