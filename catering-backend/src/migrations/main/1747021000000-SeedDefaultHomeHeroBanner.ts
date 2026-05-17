import { MigrationInterface, QueryRunner } from 'typeorm';

/** One default hero slide so the home page and admin are not empty on fresh installs. */
export class SeedDefaultHomeHeroBanner1747021000000 implements MigrationInterface {
  name = 'SeedDefaultHomeHeroBanner1747021000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const rows = (await queryRunner.query(
      `SELECT COUNT(*) AS c FROM home_banners WHERE placement = 'hero'`,
    )) as { c: number }[];
    const count = Number(rows[0]?.c ?? 0);
    if (count > 0) return;

    const imageKey =
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1920&q=80';

    await queryRunner.query(
      `INSERT INTO home_banners (
        id, placement, title, subtitle, image_key,
        link_href, link_label, display_order, is_active,
        created_at, updated_at
      ) VALUES (
        UUID(), 'hero', NULL, NULL, ?,
        NULL, NULL, 0, 1,
        CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
      )`,
      [imageKey],
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM home_banners
       WHERE placement = 'hero'
         AND image_key = ?`,
      [
        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1920&q=80',
      ],
    );
  }
}
