import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Expands `attributes.type` ENUM, adds stable `code` (unique per type),
 * seeds catalog rows + English names (matches product taxonomy sheet).
 */
export class ExpandAttributeTypesAndSeed1746910000000 implements MigrationInterface {
  name = 'ExpandAttributeTypesAndSeed1746910000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`attributes\`
      MODIFY COLUMN \`type\` ENUM(
        'audience',
        'beverage_type',
        'counter_type',
        'course',
        'cuisine',
        'dietary',
        'event',
        'food_category',
        'meal_time',
        'package_type',
        'portion',
        'preparation',
        'recommendation',
        'season',
        'service',
        'spice',
        'temperature'
      ) NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`attributes\`
      ADD COLUMN \`code\` varchar(100) NULL AFTER \`type\`
    `);

    await queryRunner.query(`
      UPDATE \`attributes\` SET \`code\` = CONCAT('LEGACY_', \`id\`) WHERE \`code\` IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`attributes\`
      MODIFY COLUMN \`code\` varchar(100) NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`attributes\`
      ADD UNIQUE KEY \`UQ_attributes_type_code\` (\`type\`, \`code\`)
    `);

    const rows: ReadonlyArray<{ type: string; code: string; en: string }> = [
      { type: 'cuisine', code: 'PUNJABI', en: 'Punjabi' },
      { type: 'cuisine', code: 'GUJARATI', en: 'Gujarati' },
      { type: 'cuisine', code: 'SOUTH_INDIAN', en: 'South Indian' },
      { type: 'cuisine', code: 'NORTH_INDIAN', en: 'North Indian' },
      { type: 'cuisine', code: 'CHINESE', en: 'Chinese' },
      { type: 'cuisine', code: 'ITALIAN', en: 'Italian' },
      { type: 'dietary', code: 'VEG', en: 'Veg' },
      { type: 'dietary', code: 'NON_VEG', en: 'Non Veg' },
      { type: 'dietary', code: 'JAIN', en: 'Jain' },
      { type: 'dietary', code: 'VEGAN', en: 'Vegan' },
      { type: 'service', code: 'BUFFET', en: 'Buffet' },
      { type: 'service', code: 'LIVE_COUNTER', en: 'Live Counter' },
      { type: 'service', code: 'PLATED', en: 'Plated Service' },
      { type: 'spice', code: 'MILD', en: 'Mild' },
      { type: 'spice', code: 'MEDIUM', en: 'Medium' },
      { type: 'spice', code: 'SPICY', en: 'Spicy' },
      { type: 'meal_time', code: 'BREAKFAST', en: 'Breakfast' },
      { type: 'meal_time', code: 'LUNCH', en: 'Lunch' },
      { type: 'meal_time', code: 'DINNER', en: 'Dinner' },
      { type: 'event', code: 'WEDDING', en: 'Wedding' },
      { type: 'event', code: 'CORPORATE', en: 'Corporate' },
      { type: 'event', code: 'BIRTHDAY', en: 'Birthday' },
      { type: 'audience', code: 'KIDS', en: 'Kids' },
      { type: 'audience', code: 'FAMILY', en: 'Family' },
      { type: 'preparation', code: 'FRIED', en: 'Fried' },
      { type: 'preparation', code: 'BAKED', en: 'Baked' },
      { type: 'preparation', code: 'GRILLED', en: 'Grilled' },
      { type: 'temperature', code: 'HOT', en: 'Hot' },
      { type: 'temperature', code: 'COLD', en: 'Cold' },
      { type: 'course', code: 'STARTER', en: 'Starter' },
      { type: 'course', code: 'MAIN_COURSE', en: 'Main Course' },
      { type: 'course', code: 'DESSERT', en: 'Dessert' },
      { type: 'food_category', code: 'PREMIUM', en: 'Premium' },
      { type: 'food_category', code: 'REGULAR', en: 'Regular' },
      { type: 'season', code: 'SUMMER', en: 'Summer' },
      { type: 'season', code: 'WINTER', en: 'Winter' },
      { type: 'recommendation', code: 'BESTSELLER', en: 'Bestseller' },
      { type: 'recommendation', code: 'TRENDING', en: 'Trending' },
      { type: 'package_type', code: 'SILVER', en: 'Silver' },
      { type: 'package_type', code: 'GOLD', en: 'Gold' },
      { type: 'counter_type', code: 'CHAAT_COUNTER', en: 'Chaat Counter' },
      { type: 'counter_type', code: 'PASTA_COUNTER', en: 'Pasta Counter' },
      { type: 'beverage_type', code: 'MOCKTAIL', en: 'Mocktail' },
      { type: 'beverage_type', code: 'TEA', en: 'Tea' },
      { type: 'portion', code: 'MINI', en: 'Mini' },
      { type: 'portion', code: 'REGULAR', en: 'Regular' },
    ];

    const chunkSize = 25;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const tuples = chunk
        .map((r) => `('${r.type}', '${r.code}', NULL, 1, 1)`)
        .join(',\n');
      await queryRunner.query(`
        INSERT INTO \`attributes\` (\`type\`, \`code\`, \`image\`, \`is_searchable\`, \`is_active\`)
        VALUES ${tuples}
        ON DUPLICATE KEY UPDATE
          \`is_searchable\` = VALUES(\`is_searchable\`),
          \`is_active\` = VALUES(\`is_active\`)
      `);
    }

    const unionParts = rows.map(
      (r) =>
        `SELECT '${r.type}' AS typ, '${r.code}' AS cod, '${r.en.replace(/'/g, "\\'")}' AS en_name`,
    );
    const unionSql = unionParts.join(' UNION ALL\n');

    await queryRunner.query(`
      INSERT INTO \`attribute_translations\` (\`attribute_id\`, \`language_id\`, \`name\`)
      SELECT a.\`id\`, l.\`id\`, v.\`en_name\`
      FROM (\n${unionSql}\n) v
      INNER JOIN \`attributes\` a ON a.\`type\` = v.\`typ\` AND a.\`code\` = v.\`cod\`
      INNER JOIN \`languages\` l ON l.\`code\` = 'en'
      ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`)
    `);
  }

  public async down(): Promise<void> {
    /* Destructive to revert ENUM shrink after seed; use backup restore instead. */
  }
}
