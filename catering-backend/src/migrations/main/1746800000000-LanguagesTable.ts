import { MigrationInterface, QueryRunner } from 'typeorm';

export class LanguagesTable1746800000000 implements MigrationInterface {
  name = 'LanguagesTable1746800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`languages\` (
        \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`code\` varchar(10) NOT NULL,
        \`name\` varchar(100) NOT NULL,
        \`native_name\` varchar(100) NULL,
        \`direction\` varchar(10) NOT NULL DEFAULT 'ltr',
        \`is_default\` tinyint(1) NOT NULL DEFAULT 0,
        \`is_active\` tinyint(1) NOT NULL DEFAULT 1,
        \`sort_order\` int NOT NULL DEFAULT 0,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_languages_code\` (\`code\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      INSERT INTO \`languages\` (\`code\`, \`name\`, \`native_name\`, \`direction\`, \`is_default\`, \`is_active\`, \`sort_order\`)
      VALUES
        ('en', 'English', 'English', 'ltr', 1, 1, 0),
        ('hi', 'Hindi', 'हिन्दी', 'ltr', 0, 1, 1),
        ('gu', 'Gujarati', 'ગુજરાતી', 'ltr', 0, 1, 2)
      ON DUPLICATE KEY UPDATE
        \`name\` = VALUES(\`name\`),
        \`native_name\` = VALUES(\`native_name\`),
        \`direction\` = VALUES(\`direction\`),
        \`is_active\` = VALUES(\`is_active\`),
        \`sort_order\` = VALUES(\`sort_order\`)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `languages`');
  }
}
