import { MigrationInterface, QueryRunner } from 'typeorm';

export class MenuItemsTranslationsIngredientsAttributes1746970000000
  implements MigrationInterface
{
  name = 'MenuItemsTranslationsIngredientsAttributes1746970000000';

  private readonly unitEnum = `'KG','GM','LTR','ML','PCS','BOX','PACKET','BOTTLE','TRAY'`;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`menu_items\` (
        \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`category_id\` bigint unsigned NOT NULL,
        \`subcategory_id\` bigint unsigned NULL,
        \`item_code\` varchar(100) NOT NULL,
        \`slug\` varchar(255) NOT NULL,
        \`image\` varchar(500) NULL,
        \`gallery\` json NULL,
        \`video_url\` varchar(500) NULL,
        \`preparation_time\` int NOT NULL DEFAULT 0,
        \`cooking_time\` int NOT NULL DEFAULT 0,
        \`shelf_life_hours\` int NULL,
        \`base_cost\` decimal(10,2) NOT NULL DEFAULT 0,
        \`is_active\` tinyint(1) NOT NULL DEFAULT 1,
        \`created_by\` varchar(36) NULL,
        \`updated_by\` varchar(36) NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime(6) NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_menu_items_item_code\` (\`item_code\`),
        UNIQUE KEY \`UQ_menu_items_slug\` (\`slug\`),
        INDEX \`IDX_menu_items_category\` (\`category_id\`),
        INDEX \`IDX_menu_items_subcategory\` (\`subcategory_id\`),
        CONSTRAINT \`FK_menu_items_category\` FOREIGN KEY (\`category_id\`) REFERENCES \`menu_categories\`(\`id\`) ON DELETE RESTRICT,
        CONSTRAINT \`FK_menu_items_subcategory\` FOREIGN KEY (\`subcategory_id\`) REFERENCES \`menu_categories\`(\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`FK_menu_items_created_by\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`FK_menu_items_updated_by\` FOREIGN KEY (\`updated_by\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`menu_item_translations\` (
        \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`menu_item_id\` bigint unsigned NOT NULL,
        \`language_id\` bigint unsigned NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`description\` text NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime(6) NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_menu_item_translation_item_language\` (\`menu_item_id\`, \`language_id\`),
        INDEX \`IDX_menu_item_translations_language\` (\`language_id\`),
        CONSTRAINT \`FK_menu_item_translations_item\` FOREIGN KEY (\`menu_item_id\`) REFERENCES \`menu_items\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_menu_item_translations_language\` FOREIGN KEY (\`language_id\`) REFERENCES \`languages\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`menu_item_ingredients\` (
        \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`menu_item_id\` bigint unsigned NOT NULL,
        \`ingredient_id\` bigint unsigned NOT NULL,
        \`quantity\` decimal(10,3) NOT NULL,
        \`unit\` enum(${this.unitEnum}) NOT NULL DEFAULT 'GM',
        \`is_optional\` tinyint(1) NOT NULL DEFAULT 0,
        \`notes\` text NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_menu_item_ingredient_pair\` (\`menu_item_id\`, \`ingredient_id\`),
        INDEX \`IDX_menu_item_ingredients_ingredient\` (\`ingredient_id\`),
        CONSTRAINT \`FK_menu_item_ingredients_item\` FOREIGN KEY (\`menu_item_id\`) REFERENCES \`menu_items\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_menu_item_ingredients_ingredient\` FOREIGN KEY (\`ingredient_id\`) REFERENCES \`ingredients\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`menu_item_attributes\` (
        \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`menu_item_id\` bigint unsigned NOT NULL,
        \`attribute_id\` bigint unsigned NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_menu_item_attribute_pair\` (\`menu_item_id\`, \`attribute_id\`),
        INDEX \`IDX_menu_item_attributes_attribute\` (\`attribute_id\`),
        CONSTRAINT \`FK_menu_item_attributes_item\` FOREIGN KEY (\`menu_item_id\`) REFERENCES \`menu_items\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_menu_item_attributes_attribute\` FOREIGN KEY (\`attribute_id\`) REFERENCES \`attributes\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `menu_item_attributes`');
    await queryRunner.query('DROP TABLE IF EXISTS `menu_item_ingredients`');
    await queryRunner.query('DROP TABLE IF EXISTS `menu_item_translations`');
    await queryRunner.query('DROP TABLE IF EXISTS `menu_items`');
  }
}
