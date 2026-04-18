import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

/**
 * Public marketplace rows (main DB): caterer discovery, filters, profile detail URLs.
 */
export class CatererMarketplaceListings1743320000000 implements MigrationInterface {
  name = 'CatererMarketplaceListings1743320000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const has = await queryRunner.hasTable('caterer_marketplace_listings');
    if (!has) {
      await queryRunner.createTable(
        new Table({
          name: 'caterer_marketplace_listings',
          columns: [
            { name: 'id', type: 'char', length: '36', isPrimary: true },
            { name: 'tenant_id', type: 'char', length: '36', isUnique: true, isNullable: false },
            { name: 'city', type: 'varchar', length: '120', isNullable: true },
            { name: 'state', type: 'varchar', length: '120', isNullable: true },
            { name: 'country', type: 'varchar', length: '80', isNullable: true, default: `'India'` },
            { name: 'primary_category_id', type: 'varchar', length: '32', isNullable: true },
            { name: 'cuisines', type: 'json', isNullable: true },
            { name: 'price_band', type: 'varchar', length: '16', isNullable: true },
            { name: 'tagline', type: 'varchar', length: '220', isNullable: true },
            { name: 'about', type: 'text', isNullable: true },
            { name: 'hero_image_url', type: 'varchar', length: '512', isNullable: true },
            { name: 'gallery_images', type: 'json', isNullable: true },
            { name: 'services_offered', type: 'json', isNullable: true },
            { name: 'years_in_business', type: 'smallint', unsigned: true, isNullable: true },
            { name: 'capacity_hint', type: 'varchar', length: '80', isNullable: true },
            { name: 'avg_rating', type: 'decimal', precision: 2, scale: 1, default: `'0.0'` },
            { name: 'review_count', type: 'int', unsigned: true, default: 0 },
            { name: 'price_hint', type: 'varchar', length: '120', isNullable: true },
            { name: 'published', type: 'tinyint', width: 1, default: 0 },
            { name: 'created_at', type: 'datetime', precision: 6, default: 'CURRENT_TIMESTAMP(6)' },
            {
              name: 'updated_at',
              type: 'datetime',
              precision: 6,
              default: 'CURRENT_TIMESTAMP(6)',
              onUpdate: 'CURRENT_TIMESTAMP(6)',
            },
          ],
        }),
        true,
      );

      await queryRunner.createForeignKey(
        'caterer_marketplace_listings',
        new TableForeignKey({
          columnNames: ['tenant_id'],
          referencedTableName: 'tenants',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createIndex(
        'caterer_marketplace_listings',
        new TableIndex({ name: 'IDX_cml_published_city', columnNames: ['published', 'city'] }),
      );
      await queryRunner.createIndex(
        'caterer_marketplace_listings',
        new TableIndex({
          name: 'IDX_cml_published_category',
          columnNames: ['published', 'primary_category_id'],
        }),
      );
      await queryRunner.createIndex(
        'caterer_marketplace_listings',
        new TableIndex({
          name: 'IDX_cml_published_price_band',
          columnNames: ['published', 'price_band'],
        }),
      );
    }

    // Backfill one marketplace row per tenant (demo-friendly: published + varied filters).
    await queryRunner.query(`
INSERT INTO \`caterer_marketplace_listings\` (
  \`id\`, \`tenant_id\`, \`city\`, \`state\`, \`country\`, \`primary_category_id\`,
  \`cuisines\`, \`price_band\`, \`tagline\`, \`about\`, \`hero_image_url\`, \`gallery_images\`,
  \`services_offered\`, \`years_in_business\`, \`capacity_hint\`,
  \`avg_rating\`, \`review_count\`, \`price_hint\`, \`published\`, \`created_at\`, \`updated_at\`
)
SELECT
  UUID(),
  t.\`id\`,
  ELT(1 + (CRC32(t.\`id\`) MOD 8), 'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad'),
  NULL,
  'India',
  ELT(1 + (CRC32(CONCAT(t.\`id\`, 'c')) MOD 6), 'c1', 'c2', 'c3', 'c4', 'c5', 'c6'),
  JSON_ARRAY('North Indian', 'Continental', 'Desserts'),
  ELT(1 + (CRC32(CONCAT(t.\`id\`, 'p')) MOD 4), 'budget', 'mid', 'premium', 'custom'),
  CONCAT('Memorable events with ', t.\`name\`),
  CONCAT(
    t.\`name\`,
    ' plans menus, staffing, and logistics for weddings, corporate events, and private celebrations. ',
    'Guests enjoy consistent quality, hygienic preparation, and flexible packages tailored to your budget.'
  ),
  NULL,
  JSON_ARRAY(),
  JSON_ARRAY('Wedding & buffet catering', 'Corporate lunches', 'Live counters', 'Custom menus'),
  (5 + (CRC32(t.\`id\`) MOD 12)),
  '50–500 guests',
  ROUND(4.0 + (CRC32(CONCAT(t.\`id\`, 'r')) MOD 11) / 10, 1),
  (20 + (CRC32(CONCAT(t.\`id\`, 'v')) MOD 180)),
  ELT(1 + (CRC32(CONCAT(t.\`id\`, '$')) MOD 3), 'From ₹350 / plate', 'From ₹550 / plate', 'Custom quote'),
  1,
  CURRENT_TIMESTAMP(6),
  CURRENT_TIMESTAMP(6)
FROM \`tenants\` t
WHERE NOT EXISTS (
  SELECT 1 FROM \`caterer_marketplace_listings\` m WHERE m.\`tenant_id\` = t.\`id\`
)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('caterer_marketplace_listings')) {
      await queryRunner.dropTable('caterer_marketplace_listings', true);
    }
  }
}
