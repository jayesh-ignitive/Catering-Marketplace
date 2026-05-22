import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  DEFAULT_COMPARISON_ROWS_EN,
  DEFAULT_LISTING_PLANS_EN,
  DEFAULT_PACKAGES_PAGE_EN,
} from '../../listing-packages/default-packages-content';

function escapeSql(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "''");
}

export class ListingPackagesCms1747100000000 implements MigrationInterface {
  name = 'ListingPackagesCms1747100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`listing_packages_page_translations\` (
        \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`language_id\` bigint unsigned NOT NULL,
        \`hero_eyebrow\` varchar(255) NOT NULL,
        \`hero_title\` varchar(255) NOT NULL,
        \`hero_subtitle\` text NOT NULL,
        \`value_title\` varchar(255) NOT NULL,
        \`value_body\` text NOT NULL,
        \`discover_title\` varchar(255) NOT NULL,
        \`discover_subtitle\` text NOT NULL,
        \`comparison_title\` varchar(255) NOT NULL,
        \`comparison_hint\` varchar(255) NOT NULL,
        \`feature_column_label\` varchar(120) NOT NULL,
        \`tier_essential_label\` varchar(64) NOT NULL,
        \`tier_growth_label\` varchar(64) NOT NULL,
        \`tier_premier_label\` varchar(64) NOT NULL,
        \`recommended_badge\` varchar(120) NOT NULL,
        \`audience_title\` varchar(255) NOT NULL,
        \`audience_subtitle\` text NOT NULL,
        \`audience_tags_json\` text NOT NULL,
        \`help_title\` varchar(255) NOT NULL,
        \`help_body\` text NOT NULL,
        \`browse_directory_label\` varchar(255) NOT NULL,
        \`disclaimer_text\` text NOT NULL,
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_listing_packages_page_translation_language\` (\`language_id\`),
        CONSTRAINT \`FK_listing_packages_page_translation_language\` FOREIGN KEY (\`language_id\`) REFERENCES \`languages\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`listing_plans\` (
        \`id\` char(36) NOT NULL,
        \`code\` varchar(32) NOT NULL,
        \`price_display\` varchar(64) NOT NULL,
        \`icon\` varchar(32) NOT NULL DEFAULT 'medal',
        \`is_recommended\` tinyint(1) NOT NULL DEFAULT 0,
        \`is_dark_theme\` tinyint(1) NOT NULL DEFAULT 0,
        \`display_order\` int NOT NULL DEFAULT 0,
        \`is_active\` tinyint(1) NOT NULL DEFAULT 1,
        \`contact_topic\` varchar(120) NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_listing_plans_code\` (\`code\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`listing_plan_translations\` (
        \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`listing_plan_id\` char(36) NOT NULL,
        \`language_id\` bigint unsigned NOT NULL,
        \`name\` varchar(120) NOT NULL,
        \`subtitle\` varchar(255) NOT NULL,
        \`period_label\` varchar(120) NOT NULL,
        \`cta_label\` varchar(120) NOT NULL,
        \`features_json\` text NOT NULL,
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_listing_plan_translation_plan_language\` (\`listing_plan_id\`, \`language_id\`),
        CONSTRAINT \`FK_listing_plan_translations_plan\` FOREIGN KEY (\`listing_plan_id\`) REFERENCES \`listing_plans\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_listing_plan_translations_language\` FOREIGN KEY (\`language_id\`) REFERENCES \`languages\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`listing_plan_comparison_rows\` (
        \`id\` char(36) NOT NULL,
        \`sort_order\` int NOT NULL DEFAULT 0,
        \`is_active\` tinyint(1) NOT NULL DEFAULT 1,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`listing_plan_comparison_row_translations\` (
        \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`comparison_row_id\` char(36) NOT NULL,
        \`language_id\` bigint unsigned NOT NULL,
        \`label\` varchar(255) NOT NULL,
        \`essential_value\` varchar(120) NOT NULL,
        \`growth_value\` varchar(120) NOT NULL,
        \`premier_value\` varchar(120) NOT NULL,
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_listing_plan_comparison_row_translation\` (\`comparison_row_id\`, \`language_id\`),
        CONSTRAINT \`FK_listing_plan_comparison_row_translations_row\` FOREIGN KEY (\`comparison_row_id\`) REFERENCES \`listing_plan_comparison_rows\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_listing_plan_comparison_row_translations_language\` FOREIGN KEY (\`language_id\`) REFERENCES \`languages\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const p = DEFAULT_PACKAGES_PAGE_EN;
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
      FROM \`languages\` l WHERE l.code = 'en'
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

    for (const plan of DEFAULT_LISTING_PLANS_EN) {
      const planId = crypto.randomUUID();
      await queryRunner.query(
        `INSERT INTO \`listing_plans\`
          (\`id\`, \`code\`, \`price_display\`, \`icon\`, \`is_recommended\`, \`is_dark_theme\`, \`display_order\`, \`is_active\`, \`contact_topic\`)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
         ON DUPLICATE KEY UPDATE
           \`price_display\` = VALUES(\`price_display\`),
           \`icon\` = VALUES(\`icon\`),
           \`is_recommended\` = VALUES(\`is_recommended\`),
           \`is_dark_theme\` = VALUES(\`is_dark_theme\`),
           \`display_order\` = VALUES(\`display_order\`),
           \`contact_topic\` = VALUES(\`contact_topic\`)`,
        [
          planId,
          plan.code,
          plan.priceDisplay,
          plan.icon,
          plan.isRecommended ? 1 : 0,
          plan.isDarkTheme ? 1 : 0,
          plan.displayOrder,
          plan.contactTopic,
        ],
      );

      const existing = await queryRunner.query(
        `SELECT id FROM listing_plans WHERE code = ? LIMIT 1`,
        [plan.code],
      );
      const resolvedId = (existing as { id: string }[])[0]?.id ?? planId;

      const featuresJson = escapeSql(JSON.stringify(plan.features));
      await queryRunner.query(`
        INSERT INTO \`listing_plan_translations\`
          (\`listing_plan_id\`, \`language_id\`, \`name\`, \`subtitle\`, \`period_label\`, \`cta_label\`, \`features_json\`)
        SELECT '${resolvedId}', l.id,
          '${escapeSql(plan.name)}', '${escapeSql(plan.subtitle)}',
          '${escapeSql(plan.periodLabel)}', '${escapeSql(plan.ctaLabel)}', '${featuresJson}'
        FROM \`languages\` l WHERE l.code = 'en'
        ON DUPLICATE KEY UPDATE
          \`name\` = VALUES(\`name\`),
          \`subtitle\` = VALUES(\`subtitle\`),
          \`period_label\` = VALUES(\`period_label\`),
          \`cta_label\` = VALUES(\`cta_label\`),
          \`features_json\` = VALUES(\`features_json\`)
      `);
    }

    for (const row of DEFAULT_COMPARISON_ROWS_EN) {
      const rowId = crypto.randomUUID();
      await queryRunner.query(
        `INSERT INTO \`listing_plan_comparison_rows\` (\`id\`, \`sort_order\`, \`is_active\`)
         VALUES (?, ?, 1)
         ON DUPLICATE KEY UPDATE \`sort_order\` = VALUES(\`sort_order\`)`,
        [rowId, row.sortOrder],
      );

      const rows = await queryRunner.query(
        `SELECT id FROM listing_plan_comparison_rows WHERE sort_order = ? LIMIT 1`,
        [row.sortOrder],
      );
      const resolvedRowId = (rows as { id: string }[])[0]?.id ?? rowId;

      await queryRunner.query(`
        INSERT INTO \`listing_plan_comparison_row_translations\`
          (\`comparison_row_id\`, \`language_id\`, \`label\`, \`essential_value\`, \`growth_value\`, \`premier_value\`)
        SELECT '${resolvedRowId}', l.id,
          '${escapeSql(row.label)}',
          '${escapeSql(row.essentialValue)}',
          '${escapeSql(row.growthValue)}',
          '${escapeSql(row.premierValue)}'
        FROM \`languages\` l WHERE l.code = 'en'
        ON DUPLICATE KEY UPDATE
          \`label\` = VALUES(\`label\`),
          \`essential_value\` = VALUES(\`essential_value\`),
          \`growth_value\` = VALUES(\`growth_value\`),
          \`premier_value\` = VALUES(\`premier_value\`)
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS \`listing_plan_comparison_row_translations\``,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS \`listing_plan_comparison_rows\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`listing_plan_translations\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`listing_plans\``);
    await queryRunner.query(
      `DROP TABLE IF EXISTS \`listing_packages_page_translations\``,
    );
  }
}
