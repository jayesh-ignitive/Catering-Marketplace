import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Gallery rows can store hosted URLs, `/uploads/...` paths resolved to full URLs, or base64 `data:image/*`.
 * Hero banner matches. VARCHAR(512) from an older migration caused ER_DATA_TOO_LONG → HTTP 500 on PATCH …/step/2.
 */
export class GalleryAndHeroImageUrlLongtext1743700000000 implements MigrationInterface {
  name = 'GalleryAndHeroImageUrlLongtext1743700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`caterer_profile_gallery_images\` MODIFY \`url\` LONGTEXT NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE \`caterer_profiles\` MODIFY \`hero_image_url\` LONGTEXT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`caterer_profile_gallery_images\` MODIFY \`url\` VARCHAR(512) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`caterer_profiles\` MODIFY \`hero_image_url\` VARCHAR(512) NULL`,
    );
  }
}
