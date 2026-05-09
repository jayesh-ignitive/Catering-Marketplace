import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedMenuCategoriesTranslations1746815000000 implements MigrationInterface {
  name = 'SeedMenuCategoriesTranslations1746815000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO \`menu_categories\` (\`slug\`, \`image_url\`, \`display_order\`, \`is_featured\`, \`is_active\`)
      VALUES
        ('starters', NULL, 1, 1, 1),
        ('main-course', NULL, 2, 1, 1),
        ('desserts', NULL, 3, 1, 1),
        ('beverages', NULL, 4, 1, 1)
      ON DUPLICATE KEY UPDATE
        \`display_order\` = VALUES(\`display_order\`),
        \`is_featured\` = VALUES(\`is_featured\`),
        \`is_active\` = VALUES(\`is_active\`)
    `);

    await queryRunner.query(`
      INSERT INTO \`menu_categories\` (\`parent_id\`, \`slug\`, \`image_url\`, \`display_order\`, \`is_featured\`, \`is_active\`)
      SELECT p.\`id\`, 'soups', NULL, 10, 0, 1
      FROM \`menu_categories\` p
      WHERE p.\`slug\` = 'starters'
      ON DUPLICATE KEY UPDATE
        \`parent_id\` = VALUES(\`parent_id\`),
        \`display_order\` = VALUES(\`display_order\`),
        \`is_active\` = VALUES(\`is_active\`)
    `);

    await queryRunner.query(`
      INSERT INTO \`menu_categories\` (\`parent_id\`, \`slug\`, \`image_url\`, \`display_order\`, \`is_featured\`, \`is_active\`)
      SELECT p.\`id\`, 'paneer-specials', NULL, 20, 0, 1
      FROM \`menu_categories\` p
      WHERE p.\`slug\` = 'main-course'
      ON DUPLICATE KEY UPDATE
        \`parent_id\` = VALUES(\`parent_id\`),
        \`display_order\` = VALUES(\`display_order\`),
        \`is_active\` = VALUES(\`is_active\`)
    `);

    const rows: Array<{
      slug: string;
      lang: string;
      name: string;
      description: string;
    }> = [
      {
        slug: 'starters',
        lang: 'en',
        name: 'Starters',
        description: 'Light bites and opening dishes.',
      },
      {
        slug: 'starters',
        lang: 'hi',
        name: 'स्टार्टर्स',
        description: 'हल्के नाश्ते और शुरुआती व्यंजन।',
      },
      {
        slug: 'starters',
        lang: 'gu',
        name: 'સ્ટાર્ટર્સ',
        description: 'હળવા નાસ્તા અને શરૂઆતના વ્યંજનો.',
      },

      {
        slug: 'main-course',
        lang: 'en',
        name: 'Main Course',
        description: 'Complete meal dishes for lunch and dinner.',
      },
      {
        slug: 'main-course',
        lang: 'hi',
        name: 'मुख्य भोजन',
        description: 'दोपहर और रात के लिए मुख्य व्यंजन।',
      },
      {
        slug: 'main-course',
        lang: 'gu',
        name: 'મુખ્ય ભોજન',
        description: 'બપોર અને રાત માટેના મુખ્ય વ્યંજનો.',
      },

      {
        slug: 'desserts',
        lang: 'en',
        name: 'Desserts',
        description: 'Sweet endings and festive treats.',
      },
      {
        slug: 'desserts',
        lang: 'hi',
        name: 'मिठाइयाँ',
        description: 'मीठे व्यंजन और त्यौहारी स्वाद।',
      },
      {
        slug: 'desserts',
        lang: 'gu',
        name: 'મીઠાઈઓ',
        description: 'મીઠા વ્યંજનો અને તહેવારી સ્વાદ.',
      },

      {
        slug: 'beverages',
        lang: 'en',
        name: 'Beverages',
        description: 'Hot and cold drink options.',
      },
      {
        slug: 'beverages',
        lang: 'hi',
        name: 'पेय पदार्थ',
        description: 'गरम और ठंडे पेय विकल्प।',
      },
      {
        slug: 'beverages',
        lang: 'gu',
        name: 'પેય પદાર્થ',
        description: 'ગરમ અને ઠંડા પીણાંના વિકલ્પો.',
      },

      {
        slug: 'soups',
        lang: 'en',
        name: 'Soups',
        description: 'Warm and comforting soup varieties.',
      },
      {
        slug: 'soups',
        lang: 'hi',
        name: 'सूप',
        description: 'गरम और पौष्टिक सूप की किस्में।',
      },
      {
        slug: 'soups',
        lang: 'gu',
        name: 'સૂપ',
        description: 'ગરમ અને પૌષ્ટિક સૂપની વિવિધતા.',
      },

      {
        slug: 'paneer-specials',
        lang: 'en',
        name: 'Paneer Specials',
        description: 'Signature paneer-based main dishes.',
      },
      {
        slug: 'paneer-specials',
        lang: 'hi',
        name: 'पनीर स्पेशल',
        description: 'पनीर आधारित खास मुख्य व्यंजन।',
      },
      {
        slug: 'paneer-specials',
        lang: 'gu',
        name: 'પનીર સ્પેશિયલ',
        description: 'પનીર આધારિત ખાસ મુખ્ય વ્યંજનો.',
      },
    ];

    for (const r of rows) {
      await queryRunner.query(
        `
          INSERT INTO \`menu_category_translations\` (\`category_id\`, \`language_id\`, \`name\`, \`description\`)
          SELECT c.\`id\`, l.\`id\`, ?, ?
          FROM \`menu_categories\` c
          INNER JOIN \`languages\` l ON l.\`code\` = ? AND l.\`deleted_at\` IS NULL
          WHERE c.\`slug\` = ?
          ON DUPLICATE KEY UPDATE
            \`name\` = VALUES(\`name\`),
            \`description\` = VALUES(\`description\`)
        `,
        [r.name, r.description, r.lang, r.slug],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const slugs = [
      'starters',
      'main-course',
      'desserts',
      'beverages',
      'soups',
      'paneer-specials',
    ];
    const placeholders = slugs.map(() => '?').join(', ');

    await queryRunner.query(
      `DELETE t FROM \`menu_category_translations\` t
       INNER JOIN \`menu_categories\` c ON c.\`id\` = t.\`category_id\`
       WHERE c.\`slug\` IN (${placeholders})`,
      slugs,
    );

    await queryRunner.query(
      `DELETE FROM \`menu_categories\` WHERE \`slug\` IN (${placeholders})`,
      slugs,
    );
  }
}
