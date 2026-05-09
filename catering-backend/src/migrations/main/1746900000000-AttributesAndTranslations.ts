import { MigrationInterface, QueryRunner } from 'typeorm';

export class AttributesAndTranslations1746900000000 implements MigrationInterface {
  name = 'AttributesAndTranslations1746900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`attributes\` (
        \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`type\` enum('cuisine','dietary','service','spice') NOT NULL,
        \`image\` varchar(500) NULL,
        \`is_searchable\` tinyint(1) NOT NULL DEFAULT 1,
        \`is_active\` tinyint(1) NOT NULL DEFAULT 1,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime(6) NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_attributes_type\` (\`type\`),
        INDEX \`IDX_attributes_deleted_at\` (\`deleted_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`attribute_translations\` (
        \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`attribute_id\` bigint unsigned NOT NULL,
        \`language_id\` bigint unsigned NOT NULL,
        \`name\` varchar(255) NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_attribute_translation_attribute_language\` (\`attribute_id\`, \`language_id\`),
        INDEX \`IDX_attr_trans_language\` (\`language_id\`),
        CONSTRAINT \`FK_attr_trans_attribute\` FOREIGN KEY (\`attribute_id\`) REFERENCES \`attributes\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_attr_trans_language\` FOREIGN KEY (\`language_id\`) REFERENCES \`languages\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP TABLE IF EXISTS `attribute_translations`',
    );
    await queryRunner.query('DROP TABLE IF EXISTS `attributes`');
  }
}
