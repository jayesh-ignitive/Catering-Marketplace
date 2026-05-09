import { MigrationInterface, QueryRunner } from 'typeorm';

export class MenuCategoriesAndTranslations1746805000000 implements MigrationInterface {
  name = 'MenuCategoriesAndTranslations1746805000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`menu_categories\` (
        \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`parent_id\` bigint unsigned NULL,
        \`slug\` varchar(255) NOT NULL,
        \`image_url\` text NULL,
        \`icon_url\` text NULL,
        \`display_order\` int NOT NULL DEFAULT 0,
        \`category_type\` varchar(50) NULL,
        \`is_featured\` tinyint(1) NOT NULL DEFAULT 0,
        \`is_active\` tinyint(1) NOT NULL DEFAULT 1,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_menu_categories_slug\` (\`slug\`),
        INDEX \`IDX_menu_categories_parent\` (\`parent_id\`),
        CONSTRAINT \`FK_menu_categories_parent\` FOREIGN KEY (\`parent_id\`) REFERENCES \`menu_categories\`(\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`menu_category_translations\` (
        \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`category_id\` bigint unsigned NOT NULL,
        \`language_id\` bigint unsigned NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`description\` text NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_menu_category_translation_category_language\` (\`category_id\`, \`language_id\`),
        INDEX \`IDX_mct_language\` (\`language_id\`),
        CONSTRAINT \`FK_mct_category\` FOREIGN KEY (\`category_id\`) REFERENCES \`menu_categories\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_mct_language\` FOREIGN KEY (\`language_id\`) REFERENCES \`languages\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP TABLE IF EXISTS `menu_category_translations`',
    );
    await queryRunner.query('DROP TABLE IF EXISTS `menu_categories`');
  }
}
