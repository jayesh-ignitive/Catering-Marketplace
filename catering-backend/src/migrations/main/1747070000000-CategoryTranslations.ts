import { MigrationInterface, QueryRunner } from 'typeorm';

export class CategoryTranslations1747070000000 implements MigrationInterface {
  name = 'CategoryTranslations1747070000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`category_translations\` (
        \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`category_id\` char(36) NOT NULL,
        \`language_id\` bigint unsigned NOT NULL,
        \`name\` varchar(120) NOT NULL,
        \`short_description\` varchar(255) NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_category_translation_category_language\` (\`category_id\`, \`language_id\`),
        CONSTRAINT \`FK_category_translations_category\` FOREIGN KEY (\`category_id\`) REFERENCES \`categories\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_category_translations_language\` FOREIGN KEY (\`language_id\`) REFERENCES \`languages\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      INSERT INTO \`category_translations\` (\`category_id\`, \`language_id\`, \`name\`, \`short_description\`)
      SELECT c.id, l.id, c.name, c.short_description
      FROM \`categories\` c
      INNER JOIN \`languages\` l ON l.code = 'en'
      ON DUPLICATE KEY UPDATE
        \`name\` = VALUES(\`name\`),
        \`short_description\` = VALUES(\`short_description\`)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `category_translations`');
  }
}
