import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  DEFAULT_PRIVACY_BODY_HTML,
  DEFAULT_PRIVACY_LAST_UPDATED,
  DEFAULT_PRIVACY_TITLE,
  DEFAULT_TERMS_BODY_HTML,
  DEFAULT_TERMS_LAST_UPDATED,
  DEFAULT_TERMS_TITLE,
} from '../../legal/default-legal-content';

function escapeSql(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "''");
}

export class UpdateLegalPagesBharatCaterHub1747700000000
  implements MigrationInterface
{
  name = 'UpdateLegalPagesBharatCaterHub1747700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const termsHtml = escapeSql(DEFAULT_TERMS_BODY_HTML);
    const privacyHtml = escapeSql(DEFAULT_PRIVACY_BODY_HTML);

    await queryRunner.query(`
      UPDATE \`legal_page_translations\` t
      INNER JOIN \`legal_pages\` lp ON lp.\`id\` = t.\`legal_page_id\`
      INNER JOIN \`languages\` l ON l.\`id\` = t.\`language_id\`
      SET
        t.\`title\` = '${escapeSql(DEFAULT_TERMS_TITLE)}',
        t.\`last_updated_label\` = '${escapeSql(DEFAULT_TERMS_LAST_UPDATED)}',
        t.\`body_html\` = '${termsHtml}'
      WHERE lp.\`slug\` = 'terms' AND l.\`code\` = 'en'
    `);

    await queryRunner.query(`
      UPDATE \`legal_page_translations\` t
      INNER JOIN \`legal_pages\` lp ON lp.\`id\` = t.\`legal_page_id\`
      INNER JOIN \`languages\` l ON l.\`id\` = t.\`language_id\`
      SET
        t.\`title\` = '${escapeSql(DEFAULT_PRIVACY_TITLE)}',
        t.\`last_updated_label\` = '${escapeSql(DEFAULT_PRIVACY_LAST_UPDATED)}',
        t.\`body_html\` = '${privacyHtml}'
      WHERE lp.\`slug\` = 'privacy' AND l.\`code\` = 'en'
    `);
  }

  public async down(): Promise<void> {
    // Content-only update; previous copy is not restored.
  }
}
