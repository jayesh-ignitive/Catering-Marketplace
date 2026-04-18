import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Naming conversion:
 * `caterer_marketplace_listings` -> `caterer_profiles`
 */
export class RenameCatererMarketplaceListingsToCatererProfiles1743330000000
  implements MigrationInterface
{
  name = 'RenameCatererMarketplaceListingsToCatererProfiles1743330000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasOld = await queryRunner.hasTable('caterer_marketplace_listings');
    const hasNew = await queryRunner.hasTable('caterer_profiles');

    if (hasOld && !hasNew) {
      await queryRunner.renameTable('caterer_marketplace_listings', 'caterer_profiles');
    }

    // Optional index-name cleanup for consistency.
    const indexRows = (await queryRunner.query(
      `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'caterer_profiles'`,
    )) as { INDEX_NAME: string }[];
    const names = new Set(indexRows.map((r) => r.INDEX_NAME));

    if (names.has('IDX_cml_published_city') && !names.has('IDX_cp_published_city')) {
      await queryRunner.query(
        'ALTER TABLE `caterer_profiles` RENAME INDEX `IDX_cml_published_city` TO `IDX_cp_published_city`',
      );
    }
    if (names.has('IDX_cml_published_category') && !names.has('IDX_cp_published_category')) {
      await queryRunner.query(
        'ALTER TABLE `caterer_profiles` RENAME INDEX `IDX_cml_published_category` TO `IDX_cp_published_category`',
      );
    }
    if (names.has('IDX_cml_published_price_band') && !names.has('IDX_cp_published_price_band')) {
      await queryRunner.query(
        'ALTER TABLE `caterer_profiles` RENAME INDEX `IDX_cml_published_price_band` TO `IDX_cp_published_price_band`',
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasOld = await queryRunner.hasTable('caterer_marketplace_listings');
    const hasNew = await queryRunner.hasTable('caterer_profiles');

    if (hasNew && !hasOld) {
      await queryRunner.renameTable('caterer_profiles', 'caterer_marketplace_listings');
    }
  }
}
