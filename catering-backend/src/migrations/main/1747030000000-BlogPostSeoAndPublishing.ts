import { MigrationInterface, QueryRunner } from 'typeorm';

export class BlogPostSeoAndPublishing1747030000000 implements MigrationInterface {
  name = 'BlogPostSeoAndPublishing1747030000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`blog_posts\`
        ADD COLUMN \`meta_title\` varchar(70) NULL AFTER \`title\`,
        ADD COLUMN \`meta_description\` varchar(320) NULL AFTER \`excerpt\`,
        ADD COLUMN \`og_image_url\` varchar(512) NULL AFTER \`featured_image_url\`,
        ADD COLUMN \`is_published\` tinyint NOT NULL DEFAULT 1 AFTER \`published_at\`,
        ADD COLUMN \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) AFTER \`created_at\`
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`blog_posts\`
        DROP COLUMN \`meta_title\`,
        DROP COLUMN \`meta_description\`,
        DROP COLUMN \`og_image_url\`,
        DROP COLUMN \`is_published\`,
        DROP COLUMN \`updated_at\`
    `);
  }
}
