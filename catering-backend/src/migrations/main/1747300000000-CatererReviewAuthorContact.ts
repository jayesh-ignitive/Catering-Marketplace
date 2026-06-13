import { MigrationInterface, QueryRunner } from 'typeorm';

export class CatererReviewAuthorContact1747300000000 implements MigrationInterface {
  name = 'CatererReviewAuthorContact1747300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('caterer_reviews');
    if (!table) return;

    if (!table.findColumnByName('author_email')) {
      await queryRunner.query(
        `ALTER TABLE \`caterer_reviews\` ADD COLUMN \`author_email\` varchar(255) NULL AFTER \`author_name\``,
      );
    }
    if (!table.findColumnByName('author_phone')) {
      await queryRunner.query(
        `ALTER TABLE \`caterer_reviews\` ADD COLUMN \`author_phone\` varchar(32) NULL AFTER \`author_email\``,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('caterer_reviews');
    if (!table) return;

    if (table.findColumnByName('author_phone')) {
      await queryRunner.query(
        `ALTER TABLE \`caterer_reviews\` DROP COLUMN \`author_phone\``,
      );
    }
    if (table.findColumnByName('author_email')) {
      await queryRunner.query(
        `ALTER TABLE \`caterer_reviews\` DROP COLUMN \`author_email\``,
      );
    }
  }
}
