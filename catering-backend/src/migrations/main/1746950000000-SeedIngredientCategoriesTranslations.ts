import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedIngredientCategoriesTranslations1746950000000 implements MigrationInterface {
  name = 'SeedIngredientCategoriesTranslations1746950000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO \`ingredient_categories\` (\`slug\`, \`image_url\`, \`display_order\`, \`is_featured\`, \`is_active\`)
      VALUES
        ('dairy', NULL, 1, 0, 1),
        ('vegetables', NULL, 2, 0, 1),
        ('fruits', NULL, 3, 0, 1),
        ('spices', NULL, 4, 0, 1),
        ('oils', NULL, 5, 0, 1),
        ('flour', NULL, 6, 0, 1),
        ('rice', NULL, 7, 0, 1),
        ('pulses', NULL, 8, 0, 1),
        ('dry-fruits', NULL, 9, 0, 1),
        ('bakery', NULL, 10, 0, 1),
        ('sauces', NULL, 11, 0, 1),
        ('frozen-food', NULL, 12, 0, 1),
        ('beverages', NULL, 13, 0, 1),
        ('packaging-materials', NULL, 14, 0, 1),
        ('cleaning-supplies', NULL, 15, 0, 1)
      ON DUPLICATE KEY UPDATE
        \`display_order\` = VALUES(\`display_order\`),
        \`is_active\` = VALUES(\`is_active\`)
    `);

    const rows: Array<{ slug: string; lang: string; name: string }> = [
      { slug: 'dairy', lang: 'en', name: 'Dairy' },
      { slug: 'dairy', lang: 'hi', name: 'डेयरी' },
      { slug: 'dairy', lang: 'gu', name: 'ડેરી' },

      { slug: 'vegetables', lang: 'en', name: 'Vegetables' },
      { slug: 'vegetables', lang: 'hi', name: 'सब्ज़ियाँ' },
      { slug: 'vegetables', lang: 'gu', name: 'શાકભાજી' },

      { slug: 'fruits', lang: 'en', name: 'Fruits' },
      { slug: 'fruits', lang: 'hi', name: 'फल' },
      { slug: 'fruits', lang: 'gu', name: 'ફળો' },

      { slug: 'spices', lang: 'en', name: 'Spices' },
      { slug: 'spices', lang: 'hi', name: 'मसाले' },
      { slug: 'spices', lang: 'gu', name: 'મસાલા' },

      { slug: 'oils', lang: 'en', name: 'Oils' },
      { slug: 'oils', lang: 'hi', name: 'तेल' },
      { slug: 'oils', lang: 'gu', name: 'તેલ' },

      { slug: 'flour', lang: 'en', name: 'Flour' },
      { slug: 'flour', lang: 'hi', name: 'आटा' },
      { slug: 'flour', lang: 'gu', name: 'લોટ' },

      { slug: 'rice', lang: 'en', name: 'Rice' },
      { slug: 'rice', lang: 'hi', name: 'चावल' },
      { slug: 'rice', lang: 'gu', name: 'ચોખા' },

      { slug: 'pulses', lang: 'en', name: 'Pulses' },
      { slug: 'pulses', lang: 'hi', name: 'दालें' },
      { slug: 'pulses', lang: 'gu', name: 'દાળો' },

      { slug: 'dry-fruits', lang: 'en', name: 'Dry Fruits' },
      { slug: 'dry-fruits', lang: 'hi', name: 'सूखे मेवे' },
      { slug: 'dry-fruits', lang: 'gu', name: 'સૂકા મેવા' },

      { slug: 'bakery', lang: 'en', name: 'Bakery' },
      { slug: 'bakery', lang: 'hi', name: 'बेकरी' },
      { slug: 'bakery', lang: 'gu', name: 'બેકરી' },

      { slug: 'sauces', lang: 'en', name: 'Sauces' },
      { slug: 'sauces', lang: 'hi', name: 'सॉस' },
      { slug: 'sauces', lang: 'gu', name: 'સૉસ' },

      { slug: 'frozen-food', lang: 'en', name: 'Frozen Food' },
      { slug: 'frozen-food', lang: 'hi', name: 'जमे हुए खाद्य' },
      { slug: 'frozen-food', lang: 'gu', name: 'ફ્રોઝન ફૂડ' },

      { slug: 'beverages', lang: 'en', name: 'Beverages' },
      { slug: 'beverages', lang: 'hi', name: 'पेय पदार्थ' },
      { slug: 'beverages', lang: 'gu', name: 'પેય પદાર્થ' },

      { slug: 'packaging-materials', lang: 'en', name: 'Packaging Materials' },
      { slug: 'packaging-materials', lang: 'hi', name: 'पैकेजिंग सामग्री' },
      { slug: 'packaging-materials', lang: 'gu', name: 'પેકેજિંગ સામગ્રી' },

      { slug: 'cleaning-supplies', lang: 'en', name: 'Cleaning Supplies' },
      { slug: 'cleaning-supplies', lang: 'hi', name: 'सफाई सामग्री' },
      { slug: 'cleaning-supplies', lang: 'gu', name: 'સફાઈ સામગ્રી' },
    ];

    for (const r of rows) {
      await queryRunner.query(
        `
          INSERT INTO \`ingredient_category_translations\` (\`category_id\`, \`language_id\`, \`name\`)
          SELECT c.\`id\`, l.\`id\`, ?
          FROM \`ingredient_categories\` c
          INNER JOIN \`languages\` l ON l.\`code\` = ? AND l.\`deleted_at\` IS NULL
          WHERE c.\`slug\` = ?
          ON DUPLICATE KEY UPDATE
            \`name\` = VALUES(\`name\`)
        `,
        [r.name, r.lang, r.slug],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const slugs = [
      'dairy',
      'vegetables',
      'fruits',
      'spices',
      'oils',
      'flour',
      'rice',
      'pulses',
      'dry-fruits',
      'bakery',
      'sauces',
      'frozen-food',
      'beverages',
      'packaging-materials',
      'cleaning-supplies',
    ];
    const placeholders = slugs.map(() => '?').join(', ');

    await queryRunner.query(
      `DELETE t FROM \`ingredient_category_translations\` t
       INNER JOIN \`ingredient_categories\` c ON c.\`id\` = t.\`category_id\`
       WHERE c.\`slug\` IN (${placeholders})`,
      slugs,
    );

    await queryRunner.query(
      `DELETE FROM \`ingredient_categories\` WHERE \`slug\` IN (${placeholders})`,
      slugs,
    );
  }
}
