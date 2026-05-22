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

export class LegalPagesAndTranslations1747060000000
  implements MigrationInterface
{
  name = 'LegalPagesAndTranslations1747060000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`legal_pages\` (
        \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`slug\` varchar(32) NOT NULL,
        \`is_published\` tinyint(1) NOT NULL DEFAULT 1,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_legal_pages_slug\` (\`slug\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`legal_page_translations\` (
        \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`legal_page_id\` bigint unsigned NOT NULL,
        \`language_id\` bigint unsigned NOT NULL,
        \`title\` varchar(255) NOT NULL,
        \`last_updated_label\` varchar(255) NOT NULL,
        \`body_html\` longtext NOT NULL,
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_legal_page_translation_page_language\` (\`legal_page_id\`, \`language_id\`),
        CONSTRAINT \`FK_legal_page_translations_page\` FOREIGN KEY (\`legal_page_id\`) REFERENCES \`legal_pages\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_legal_page_translations_language\` FOREIGN KEY (\`language_id\`) REFERENCES \`languages\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      INSERT INTO \`legal_pages\` (\`slug\`, \`is_published\`)
      VALUES ('terms', 1), ('privacy', 1)
      ON DUPLICATE KEY UPDATE \`slug\` = VALUES(\`slug\`)
    `);

    const termsHtml = escapeSql(DEFAULT_TERMS_BODY_HTML);
    const privacyHtml = escapeSql(DEFAULT_PRIVACY_BODY_HTML);

    await queryRunner.query(`
      INSERT INTO \`legal_page_translations\`
        (\`legal_page_id\`, \`language_id\`, \`title\`, \`last_updated_label\`, \`body_html\`)
      SELECT lp.id, l.id, '${escapeSql(DEFAULT_TERMS_TITLE)}', '${escapeSql(DEFAULT_TERMS_LAST_UPDATED)}', '${termsHtml}'
      FROM \`legal_pages\` lp
      INNER JOIN \`languages\` l ON l.code = 'en'
      WHERE lp.slug = 'terms'
      ON DUPLICATE KEY UPDATE
        \`title\` = VALUES(\`title\`),
        \`last_updated_label\` = VALUES(\`last_updated_label\`),
        \`body_html\` = VALUES(\`body_html\`)
    `);

    await queryRunner.query(`
      INSERT INTO \`legal_page_translations\`
        (\`legal_page_id\`, \`language_id\`, \`title\`, \`last_updated_label\`, \`body_html\`)
      SELECT lp.id, l.id, '${escapeSql(DEFAULT_PRIVACY_TITLE)}', '${escapeSql(DEFAULT_PRIVACY_LAST_UPDATED)}', '${privacyHtml}'
      FROM \`legal_pages\` lp
      INNER JOIN \`languages\` l ON l.code = 'en'
      WHERE lp.slug = 'privacy'
      ON DUPLICATE KEY UPDATE
        \`title\` = VALUES(\`title\`),
        \`last_updated_label\` = VALUES(\`last_updated_label\`),
        \`body_html\` = VALUES(\`body_html\`)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `legal_page_translations`');
    await queryRunner.query('DROP TABLE IF EXISTS `legal_pages`');
  }
}
