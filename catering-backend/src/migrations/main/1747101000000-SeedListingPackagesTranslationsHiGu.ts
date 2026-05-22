import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  COMPARISON_ROW_I18N,
  PACKAGES_PAGE_I18N,
  PLAN_I18N,
} from '../../seeds/listing-packages-i18n.seed';

function escapeSql(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "''");
}

export class SeedListingPackagesTranslationsHiGu1747101000000
  implements MigrationInterface
{
  name = 'SeedListingPackagesTranslationsHiGu1747101000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const locale of ['hi', 'gu'] as const) {
      const p = PACKAGES_PAGE_I18N[locale];
      const tagsJson = escapeSql(JSON.stringify(p.audienceTags));
      await queryRunner.query(`
        INSERT INTO \`listing_packages_page_translations\`
          (\`language_id\`, \`hero_eyebrow\`, \`hero_title\`, \`hero_subtitle\`, \`value_title\`, \`value_body\`,
           \`discover_title\`, \`discover_subtitle\`, \`comparison_title\`, \`comparison_hint\`, \`feature_column_label\`,
           \`tier_essential_label\`, \`tier_growth_label\`, \`tier_premier_label\`, \`recommended_badge\`,
           \`audience_title\`, \`audience_subtitle\`, \`audience_tags_json\`, \`help_title\`, \`help_body\`,
           \`browse_directory_label\`, \`disclaimer_text\`)
        SELECT l.id,
          '${escapeSql(p.heroEyebrow)}', '${escapeSql(p.heroTitle)}', '${escapeSql(p.heroSubtitle)}',
          '${escapeSql(p.valueTitle)}', '${escapeSql(p.valueBody)}',
          '${escapeSql(p.discoverTitle)}', '${escapeSql(p.discoverSubtitle)}',
          '${escapeSql(p.comparisonTitle)}', '${escapeSql(p.comparisonHint)}', '${escapeSql(p.featureColumnLabel)}',
          '${escapeSql(p.tierEssentialLabel)}', '${escapeSql(p.tierGrowthLabel)}', '${escapeSql(p.tierPremierLabel)}',
          '${escapeSql(p.recommendedBadge)}',
          '${escapeSql(p.audienceTitle)}', '${escapeSql(p.audienceSubtitle)}', '${tagsJson}',
          '${escapeSql(p.helpTitle)}', '${escapeSql(p.helpBody)}',
          '${escapeSql(p.browseDirectoryLabel)}', '${escapeSql(p.disclaimerText)}'
        FROM \`languages\` l WHERE l.code = '${locale}'
        ON DUPLICATE KEY UPDATE
          \`hero_eyebrow\` = VALUES(\`hero_eyebrow\`),
          \`hero_title\` = VALUES(\`hero_title\`),
          \`hero_subtitle\` = VALUES(\`hero_subtitle\`),
          \`value_title\` = VALUES(\`value_title\`),
          \`value_body\` = VALUES(\`value_body\`),
          \`discover_title\` = VALUES(\`discover_title\`),
          \`discover_subtitle\` = VALUES(\`discover_subtitle\`),
          \`comparison_title\` = VALUES(\`comparison_title\`),
          \`comparison_hint\` = VALUES(\`comparison_hint\`),
          \`feature_column_label\` = VALUES(\`feature_column_label\`),
          \`tier_essential_label\` = VALUES(\`tier_essential_label\`),
          \`tier_growth_label\` = VALUES(\`tier_growth_label\`),
          \`tier_premier_label\` = VALUES(\`tier_premier_label\`),
          \`recommended_badge\` = VALUES(\`recommended_badge\`),
          \`audience_title\` = VALUES(\`audience_title\`),
          \`audience_subtitle\` = VALUES(\`audience_subtitle\`),
          \`audience_tags_json\` = VALUES(\`audience_tags_json\`),
          \`help_title\` = VALUES(\`help_title\`),
          \`help_body\` = VALUES(\`help_body\`),
          \`browse_directory_label\` = VALUES(\`browse_directory_label\`),
          \`disclaimer_text\` = VALUES(\`disclaimer_text\`)
      `);

      for (const code of ['essential', 'growth', 'premier'] as const) {
        const plan = PLAN_I18N[locale][code];
        const featuresJson = escapeSql(JSON.stringify(plan.features));
        await queryRunner.query(`
          INSERT INTO \`listing_plan_translations\`
            (\`listing_plan_id\`, \`language_id\`, \`name\`, \`subtitle\`, \`period_label\`, \`cta_label\`, \`features_json\`)
          SELECT lp.id, l.id,
            '${escapeSql(plan.name)}', '${escapeSql(plan.subtitle)}',
            '${escapeSql(plan.periodLabel)}', '${escapeSql(plan.ctaLabel)}', '${featuresJson}'
          FROM \`listing_plans\` lp
          INNER JOIN \`languages\` l ON l.code = '${locale}'
          WHERE lp.code = '${code}'
          ON DUPLICATE KEY UPDATE
            \`name\` = VALUES(\`name\`),
            \`subtitle\` = VALUES(\`subtitle\`),
            \`period_label\` = VALUES(\`period_label\`),
            \`cta_label\` = VALUES(\`cta_label\`),
            \`features_json\` = VALUES(\`features_json\`)
        `);
      }

      for (const sortOrder of Object.keys(COMPARISON_ROW_I18N[locale]).map(Number)) {
        const row = COMPARISON_ROW_I18N[locale][sortOrder];
        await queryRunner.query(`
          INSERT INTO \`listing_plan_comparison_row_translations\`
            (\`comparison_row_id\`, \`language_id\`, \`label\`, \`essential_value\`, \`growth_value\`, \`premier_value\`)
          SELECT cr.id, l.id,
            '${escapeSql(row.label)}',
            '${escapeSql(row.essentialValue)}',
            '${escapeSql(row.growthValue)}',
            '${escapeSql(row.premierValue)}'
          FROM \`listing_plan_comparison_rows\` cr
          INNER JOIN \`languages\` l ON l.code = '${locale}'
          WHERE cr.sort_order = ${sortOrder}
          ON DUPLICATE KEY UPDATE
            \`label\` = VALUES(\`label\`),
            \`essential_value\` = VALUES(\`essential_value\`),
            \`growth_value\` = VALUES(\`growth_value\`),
            \`premier_value\` = VALUES(\`premier_value\`)
        `);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE t FROM listing_plan_comparison_row_translations t
      INNER JOIN languages l ON l.id = t.language_id
      WHERE l.code IN ('hi', 'gu')
    `);
    await queryRunner.query(`
      DELETE t FROM listing_plan_translations t
      INNER JOIN languages l ON l.id = t.language_id
      WHERE l.code IN ('hi', 'gu')
    `);
    await queryRunner.query(`
      DELETE t FROM listing_packages_page_translations t
      INNER JOIN languages l ON l.id = t.language_id
      WHERE l.code IN ('hi', 'gu')
    `);
  }
}
