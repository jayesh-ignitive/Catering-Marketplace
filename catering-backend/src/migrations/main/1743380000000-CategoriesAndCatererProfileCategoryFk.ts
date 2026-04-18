import { MigrationInterface, QueryRunner, TableForeignKey, TableIndex } from 'typeorm';

const CATEGORY_SEED: [string, string, string, string][] = [
  [
    'c1',
    'Marriage & Wedding Catering',
    'marriage-wedding-catering',
    'Full-service wedding menus, live counters, and buffet setups.',
  ],
  [
    'c2',
    'Birthday Party Catering',
    'birthday-party-catering',
    'Kid-friendly spreads, snacks, and celebration cakes.',
  ],
  [
    'c3',
    'Corporate & Office Catering',
    'corporate-office-catering',
    'Box lunches, working lunches, and large team events.',
  ],
  [
    'c4',
    'Buffet Catering',
    'buffet-catering',
    'Multi-cuisine buffets with service staff.',
  ],
  [
    'c5',
    'Outdoor Catering',
    'outdoor-catering',
    'Tents, grills, and on-location kitchen support.',
  ],
  ['c6', 'Home Catering', 'home-catering', 'Intimate gatherings at your residence.'],
  [
    'c7',
    'Engagement Catering',
    'engagement-catering',
    'Ring ceremonies and family functions.',
  ],
  ['c8', 'BBQ & Live Grill', 'bbq-catering', 'Live grills, skewers, and outdoor dining.'],
];

export class CategoriesAndCatererProfileCategoryFk1743380000000 implements MigrationInterface {
  name = 'CategoriesAndCatererProfileCategoryFk1743380000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('categories')) {
      return;
    }

    await queryRunner.query(`
      CREATE TABLE \`categories\` (
        \`id\` smallint UNSIGNED NOT NULL AUTO_INCREMENT,
        \`code\` varchar(32) NOT NULL,
        \`name\` varchar(120) NOT NULL,
        \`slug\` varchar(120) NOT NULL,
        \`short_description\` varchar(255) NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_categories_code\` (\`code\`),
        UNIQUE KEY \`UQ_categories_slug\` (\`slug\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    for (const [code, name, slug, shortDescription] of CATEGORY_SEED) {
      await queryRunner.query(
        `INSERT INTO \`categories\` (\`code\`, \`name\`, \`slug\`, \`short_description\`) VALUES (?, ?, ?, ?)`,
        [code, name, slug, shortDescription],
      );
    }

    await queryRunner.query(
      `ALTER TABLE \`caterer_profiles\` ADD \`category_id\` smallint UNSIGNED NULL`,
    );

    await queryRunner.createForeignKey(
      'caterer_profiles',
      new TableForeignKey({
        name: 'FK_caterer_profiles_category',
        columnNames: ['category_id'],
        referencedTableName: 'categories',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.query(`
      UPDATE \`caterer_profiles\` cp
      INNER JOIN \`categories\` c ON c.\`code\` = cp.\`primary_category_id\`
      SET cp.\`category_id\` = c.\`id\`
    `);

    const cpTable = await queryRunner.getTable('caterer_profiles');
    const catIdx =
      cpTable?.indices.find((i) => i.name === 'IDX_cp_published_category') ??
      cpTable?.indices.find(
        (i) =>
          i.columnNames.includes('published') &&
          (i.columnNames.includes('primary_category_id') ||
            i.columnNames.includes('category_id')),
      );
    if (catIdx) {
      await queryRunner.dropIndex('caterer_profiles', catIdx);
    }
    await queryRunner.query(`ALTER TABLE \`caterer_profiles\` DROP COLUMN \`primary_category_id\``);
    await queryRunner.createIndex(
      'caterer_profiles',
      new TableIndex({
        name: 'IDX_cp_published_category',
        columnNames: ['published', 'category_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('categories'))) {
      return;
    }

    const cpTableDown = await queryRunner.getTable('caterer_profiles');
    const catIdxDown = cpTableDown?.indices.find((i) => i.name === 'IDX_cp_published_category');
    if (catIdxDown) {
      await queryRunner.dropIndex('caterer_profiles', catIdxDown);
    }

    await queryRunner.query(
      `ALTER TABLE \`caterer_profiles\` ADD \`primary_category_id\` varchar(32) NULL`,
    );

    await queryRunner.query(`
      UPDATE \`caterer_profiles\` cp
      INNER JOIN \`categories\` c ON c.\`id\` = cp.\`category_id\`
      SET cp.\`primary_category_id\` = c.\`code\`
    `);

    const table = await queryRunner.getTable('caterer_profiles');
    const fk = table?.foreignKeys.find((f) => f.name === 'FK_caterer_profiles_category');
    if (fk) {
      await queryRunner.dropForeignKey('caterer_profiles', fk);
    }
    await queryRunner.query(`ALTER TABLE \`caterer_profiles\` DROP COLUMN \`category_id\``);

    await queryRunner.query(
      `CREATE INDEX \`IDX_cp_published_category\` ON \`caterer_profiles\` (\`published\`, \`primary_category_id\`)`,
    );

    await queryRunner.dropTable('categories');
  }
}
