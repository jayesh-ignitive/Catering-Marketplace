import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  LEGAL_PAGES_I18N,
  type LegalPageSlug,
} from '../../legal/seeds/legal-pages-i18n.seed';

function escapeSql(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "''");
}

const SLUGS: LegalPageSlug[] = ['terms', 'privacy'];
const LOCALES = ['hi', 'gu'] as const;

export class SeedLegalPageTranslationsHiGu1747081000000
  implements MigrationInterface
{
  name = 'SeedLegalPageTranslationsHiGu1747081000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const slug of SLUGS) {
      for (const lang of LOCALES) {
        const copy = LEGAL_PAGES_I18N[slug][lang];
        const title = escapeSql(copy.title);
        const lastUpdated = escapeSql(copy.lastUpdatedLabel);
        const body = escapeSql(copy.bodyHtml);

        await queryRunner.query(`
          INSERT INTO \`legal_page_translations\`
            (\`legal_page_id\`, \`language_id\`, \`title\`, \`last_updated_label\`, \`body_html\`)
          SELECT lp.\`id\`, l.\`id\`, '${title}', '${lastUpdated}', '${body}'
          FROM \`legal_pages\` lp
          INNER JOIN \`languages\` l ON l.\`code\` = '${lang}'
          WHERE lp.\`slug\` = '${slug}'
          ON DUPLICATE KEY UPDATE
            \`title\` = VALUES(\`title\`),
            \`last_updated_label\` = VALUES(\`last_updated_label\`),
            \`body_html\` = VALUES(\`body_html\`)
        `);
      }
    }
  }

  public async down(): Promise<void> {
    /* Skipped — avoids deleting admin-edited hi/gu rows. */
  }
}
