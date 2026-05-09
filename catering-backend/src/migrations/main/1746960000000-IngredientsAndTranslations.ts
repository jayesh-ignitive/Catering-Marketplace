import { MigrationInterface, QueryRunner } from 'typeorm';

export class IngredientsAndTranslations1746960000000 implements MigrationInterface {
  name = 'IngredientsAndTranslations1746960000000';

  private readonly unitEnum = `'KG','GM','LTR','ML','PCS','BOX','PACKET','BOTTLE','TRAY'`;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`ingredients\` (
        \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`ingredient_category_id\` bigint unsigned NULL,
        \`ingredient_code\` varchar(100) NOT NULL,
        \`sku\` varchar(100) NULL,
        \`slug\` varchar(255) NOT NULL,
        \`image\` varchar(500) NULL,
        \`purchase_unit\` enum(${this.unitEnum}) NOT NULL DEFAULT 'KG',
        \`consumption_unit\` enum(${this.unitEnum}) NOT NULL DEFAULT 'GM',
        \`conversion_factor\` decimal(10,4) NOT NULL DEFAULT 1,
        \`shelf_life_days\` int NULL,
        \`is_active\` tinyint(1) NOT NULL DEFAULT 1,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime(6) NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_ingredients_ingredient_code\` (\`ingredient_code\`),
        UNIQUE KEY \`UQ_ingredients_slug\` (\`slug\`),
        INDEX \`IDX_ingredients_category\` (\`ingredient_category_id\`),
        CONSTRAINT \`FK_ingredients_ingredient_category\` FOREIGN KEY (\`ingredient_category_id\`) REFERENCES \`ingredient_categories\`(\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`ingredient_translations\` (
        \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`ingredient_id\` bigint unsigned NOT NULL,
        \`language_id\` bigint unsigned NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`short_name\` varchar(100) NULL,
        \`description\` text NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime(6) NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_ingredient_translation_ingredient_language\` (\`ingredient_id\`, \`language_id\`),
        INDEX \`IDX_ingredient_translations_language\` (\`language_id\`),
        CONSTRAINT \`FK_ingredient_translations_ingredient\` FOREIGN KEY (\`ingredient_id\`) REFERENCES \`ingredients\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_ingredient_translations_language\` FOREIGN KEY (\`language_id\`) REFERENCES \`languages\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP TABLE IF EXISTS `ingredient_translations`',
    );
    await queryRunner.query('DROP TABLE IF EXISTS `ingredients`');
  }
}
