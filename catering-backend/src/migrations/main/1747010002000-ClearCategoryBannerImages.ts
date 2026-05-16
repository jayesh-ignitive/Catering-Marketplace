import { MigrationInterface, QueryRunner } from 'typeorm';

/** Card banner URLs are no longer used; `image_url` stores uploaded icon assets only. */
export class ClearCategoryBannerImages1747010002000 implements MigrationInterface {
  name = 'ClearCategoryBannerImages1747010002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('categories')) {
      await queryRunner.query(`UPDATE \`categories\` SET \`image_url\` = NULL`);
    }
  }

  public async down(): Promise<void> {
    /* intentionally empty — previous banner URLs were not retained */
  }
}
