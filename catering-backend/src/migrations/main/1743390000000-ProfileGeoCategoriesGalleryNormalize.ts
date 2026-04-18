import { randomUUID } from 'crypto';
import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
  TableUnique,
} from 'typeorm';

/**
 * Normalizes caterer_profiles: geography (countries/states/cities), many-to-many categories,
 * gallery images table; removes redundant varchar/json columns.
 */
export class ProfileGeoCategoriesGalleryNormalize1743390000000 implements MigrationInterface {
  name = 'ProfileGeoCategoriesGalleryNormalize1743390000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('countries')) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'countries',
        columns: [
          {
            name: 'id',
            type: 'smallint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'name', type: 'varchar', length: '120', isNullable: false },
          { name: 'code', type: 'varchar', length: '3', isNullable: true, isUnique: true },
          {
            name: 'created_at',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
          },
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

    await queryRunner.createTable(
      new Table({
        name: 'states',
        columns: [
          {
            name: 'id',
            type: 'smallint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'country_id', type: 'smallint', unsigned: true, isNullable: false },
          { name: 'name', type: 'varchar', length: '120', isNullable: false },
          {
            name: 'created_at',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
            onUpdate: 'CURRENT_TIMESTAMP(6)',
          },
        ],
        uniques: [new TableUnique({ name: 'UQ_states_country_name', columnNames: ['country_id', 'name'] })],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['country_id'],
            referencedTableName: 'countries',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'cities',
        columns: [
          {
            name: 'id',
            type: 'int',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'state_id', type: 'smallint', unsigned: true, isNullable: false },
          { name: 'name', type: 'varchar', length: '120', isNullable: false },
          {
            name: 'created_at',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
            onUpdate: 'CURRENT_TIMESTAMP(6)',
          },
        ],
        uniques: [new TableUnique({ name: 'UQ_cities_state_name', columnNames: ['state_id', 'name'] })],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['state_id'],
            referencedTableName: 'states',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          }),
        ],
      }),
      true,
    );

    await this.seedGeoFromProfiles(queryRunner);

    await queryRunner.addColumn(
      'caterer_profiles',
      new TableColumn({
        name: 'city_id',
        type: 'int',
        unsigned: true,
        isNullable: true,
      }),
    );
    await queryRunner.createForeignKey(
      'caterer_profiles',
      new TableForeignKey({
        name: 'FK_caterer_profiles_city',
        columnNames: ['city_id'],
        referencedTableName: 'cities',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.query(`
      UPDATE \`caterer_profiles\` cp
      INNER JOIN \`countries\` co ON LOWER(co.\`name\`) = LOWER(TRIM(IFNULL(NULLIF(cp.\`country\`, ''), 'India')))
      INNER JOIN \`states\` st ON st.\`country_id\` = co.\`id\`
        AND st.\`name\` = TRIM(IFNULL(NULLIF(TRIM(cp.\`state\`), ''), 'Unspecified'))
      INNER JOIN \`cities\` ci ON ci.\`state_id\` = st.\`id\` AND ci.\`name\` = TRIM(cp.\`city\`)
      SET cp.\`city_id\` = ci.\`id\`
      WHERE cp.\`city\` IS NOT NULL AND TRIM(cp.\`city\`) <> ''
    `);

    const cpTable = await queryRunner.getTable('caterer_profiles');
    const cityIdx =
      cpTable?.indices.find((i) => i.name === 'IDX_cp_published_city') ??
      cpTable?.indices.find(
        (i) =>
          i.columnNames.includes('published') &&
          (i.columnNames.includes('city') || i.columnNames.includes('city_id')),
      );
    if (cityIdx) {
      await queryRunner.dropIndex('caterer_profiles', cityIdx);
    }
    await queryRunner.query(`ALTER TABLE \`caterer_profiles\` DROP COLUMN \`city\``);
    await queryRunner.query(`ALTER TABLE \`caterer_profiles\` DROP COLUMN \`state\``);
    await queryRunner.query(`ALTER TABLE \`caterer_profiles\` DROP COLUMN \`country\``);
    await queryRunner.createIndex(
      'caterer_profiles',
      new TableIndex({
        name: 'IDX_cp_published_city',
        columnNames: ['published', 'city_id'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'caterer_profile_categories',
        columns: [
          { name: 'caterer_profile_id', type: 'char', length: '36', isPrimary: true, isNullable: false },
          {
            name: 'category_id',
            type: 'smallint',
            unsigned: true,
            isPrimary: true,
            isNullable: false,
          },
          { name: 'sort_order', type: 'smallint', isNullable: false, default: 0 },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['caterer_profile_id'],
            referencedTableName: 'caterer_profiles',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
          new TableForeignKey({
            columnNames: ['category_id'],
            referencedTableName: 'categories',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'caterer_profile_categories',
      new TableIndex({
        name: 'IDX_cpc_category_id',
        columnNames: ['category_id'],
      }),
    );

    await queryRunner.query(`
      INSERT INTO \`caterer_profile_categories\` (\`caterer_profile_id\`, \`category_id\`, \`sort_order\`)
      SELECT \`id\`, \`category_id\`, 0 FROM \`caterer_profiles\` WHERE \`category_id\` IS NOT NULL
    `);

    const cpForCatIdx = await queryRunner.getTable('caterer_profiles');
    const catIdx = cpForCatIdx?.indices.find((i) => i.name === 'IDX_cp_published_category');
    if (catIdx) {
      await queryRunner.dropIndex('caterer_profiles', catIdx);
    }
    const cpAfterGeo = await queryRunner.getTable('caterer_profiles');
    const fkCat = cpAfterGeo?.foreignKeys.find((f) => f.name === 'FK_caterer_profiles_category');
    if (fkCat) {
      await queryRunner.dropForeignKey('caterer_profiles', fkCat);
    }
    await queryRunner.query(`ALTER TABLE \`caterer_profiles\` DROP COLUMN \`category_id\``);

    await queryRunner.createTable(
      new Table({
        name: 'caterer_profile_gallery_images',
        columns: [
          { name: 'id', type: 'char', length: '36', isPrimary: true, isNullable: false },
          { name: 'caterer_profile_id', type: 'char', length: '36', isNullable: false },
          { name: 'url', type: 'varchar', length: '512', isNullable: false },
          { name: 'sort_order', type: 'int', isNullable: false, default: 0 },
          {
            name: 'created_at',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['caterer_profile_id'],
            referencedTableName: 'caterer_profiles',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'caterer_profile_gallery_images',
      new TableIndex({
        name: 'IDX_gallery_profile_sort',
        columnNames: ['caterer_profile_id', 'sort_order'],
      }),
    );

    await this.migrateGalleryJson(queryRunner);

    await queryRunner.query(`ALTER TABLE \`caterer_profiles\` DROP COLUMN \`gallery_images\``);
  }

  private async seedGeoFromProfiles(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`INSERT INTO \`countries\` (\`name\`, \`code\`) VALUES ('India', 'IN')`);

    const countryRows = (await queryRunner.query(`
      SELECT DISTINCT TRIM(\`country\`) AS n FROM \`caterer_profiles\`
      WHERE \`country\` IS NOT NULL AND TRIM(\`country\`) <> '' AND LOWER(TRIM(\`country\`)) <> 'india'
    `)) as { n: string }[];

    for (const { n } of countryRows) {
      await queryRunner.query(`INSERT INTO \`countries\` (\`name\`, \`code\`) VALUES (?, NULL)`, [n]);
    }

    const countries = (await queryRunner.query(`SELECT \`id\`, \`name\` FROM \`countries\``)) as {
      id: number;
      name: string;
    }[];
    const countryIdByLower = new Map(countries.map((c) => [c.name.trim().toLowerCase(), c.id]));
    const indiaId = countryIdByLower.get('india');
    if (indiaId == null) {
      throw new Error('Migration: India country row missing');
    }

    const statePairs = (await queryRunner.query(`
      SELECT DISTINCT
        TRIM(IFNULL(NULLIF(\`country\`, ''), 'India')) AS country_name,
        TRIM(IFNULL(NULLIF(TRIM(\`state\`), ''), 'Unspecified')) AS state_name
      FROM \`caterer_profiles\`
    `)) as { country_name: string; state_name: string }[];

    for (const p of statePairs) {
      const key = p.country_name.trim().toLowerCase();
      let cid = countryIdByLower.get(key);
      if (cid == null) {
        await queryRunner.query(`INSERT INTO \`countries\` (\`name\`, \`code\`) VALUES (?, NULL)`, [
          p.country_name.trim(),
        ]);
        const [inserted] = (await queryRunner.query(
          `SELECT \`id\` FROM \`countries\` WHERE \`name\` = ?`,
          [p.country_name.trim()],
        )) as { id: number }[];
        cid = inserted!.id;
        countryIdByLower.set(p.country_name.trim().toLowerCase(), cid);
      }
      await queryRunner.query(
        `INSERT IGNORE INTO \`states\` (\`country_id\`, \`name\`) VALUES (?, ?)`,
        [cid, p.state_name.trim()],
      );
    }

    const cityTriples = (await queryRunner.query(`
      SELECT DISTINCT
        TRIM(IFNULL(NULLIF(\`country\`, ''), 'India')) AS country_name,
        TRIM(IFNULL(NULLIF(TRIM(\`state\`), ''), 'Unspecified')) AS state_name,
        TRIM(\`city\`) AS city_name
      FROM \`caterer_profiles\`
      WHERE \`city\` IS NOT NULL AND TRIM(\`city\`) <> ''
    `)) as { country_name: string; state_name: string; city_name: string }[];

    for (const t of cityTriples) {
      const coId = countryIdByLower.get(t.country_name.trim().toLowerCase()) ?? indiaId;
      const [st] = (await queryRunner.query(
        `SELECT \`id\` FROM \`states\` WHERE \`country_id\` = ? AND \`name\` = ?`,
        [coId, t.state_name.trim()],
      )) as { id: number }[];
      if (!st) {
        continue;
      }
      await queryRunner.query(
        `INSERT IGNORE INTO \`cities\` (\`state_id\`, \`name\`) VALUES (?, ?)`,
        [st.id, t.city_name.trim()],
      );
    }
  }

  private async migrateGalleryJson(queryRunner: QueryRunner): Promise<void> {
    const rows = (await queryRunner.query(`
      SELECT \`id\`, \`gallery_images\` FROM \`caterer_profiles\`
      WHERE \`gallery_images\` IS NOT NULL AND JSON_TYPE(\`gallery_images\`) = 'ARRAY' AND JSON_LENGTH(\`gallery_images\`) > 0
    `)) as { id: string; gallery_images: string | string[] }[];

    for (const r of rows) {
      let urls: unknown[];
      const raw = r.gallery_images;
      if (Array.isArray(raw)) {
        urls = raw;
      } else {
        try {
          urls = JSON.parse(String(raw)) as unknown[];
        } catch {
          continue;
        }
      }
      let order = 0;
      for (const u of urls) {
        if (typeof u !== 'string') {
          continue;
        }
        const url = u.trim();
        if (!url) {
          continue;
        }
        await queryRunner.query(
          `INSERT INTO \`caterer_profile_gallery_images\` (\`id\`, \`caterer_profile_id\`, \`url\`, \`sort_order\`, \`created_at\`)
           VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP(6))`,
          [randomUUID(), r.id, url.slice(0, 512), order++],
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('countries'))) {
      return;
    }

    await queryRunner.query(
      `ALTER TABLE \`caterer_profiles\` ADD \`gallery_images\` json NULL`,
    );
    const galleryRows = (await queryRunner.query(`
      SELECT \`caterer_profile_id\`, \`url\`, \`sort_order\` FROM \`caterer_profile_gallery_images\` ORDER BY \`caterer_profile_id\`, \`sort_order\`, \`created_at\`
    `)) as { caterer_profile_id: string; url: string; sort_order: number }[];
    const byProfile = new Map<string, string[]>();
    for (const g of galleryRows) {
      const list = byProfile.get(g.caterer_profile_id) ?? [];
      list.push(g.url);
      byProfile.set(g.caterer_profile_id, list);
    }
    for (const [pid, urls] of byProfile) {
      await queryRunner.query(`UPDATE \`caterer_profiles\` SET \`gallery_images\` = ? WHERE \`id\` = ?`, [
        JSON.stringify(urls),
        pid,
      ]);
    }
    await queryRunner.dropTable('caterer_profile_gallery_images', true);

    await queryRunner.query(
      `ALTER TABLE \`caterer_profiles\` ADD \`category_id\` smallint UNSIGNED NULL`,
    );
    await queryRunner.query(`
      UPDATE \`caterer_profiles\` cp
      INNER JOIN (
        SELECT \`caterer_profile_id\`, MIN(\`category_id\`) AS cid
        FROM \`caterer_profile_categories\`
        GROUP BY \`caterer_profile_id\`
      ) x ON x.\`caterer_profile_id\` = cp.\`id\`
      SET cp.\`category_id\` = x.cid
    `);
    await queryRunner.dropTable('caterer_profile_categories', true);

    const cpTblDown = await queryRunner.getTable('caterer_profiles');
    const idxPubCat = cpTblDown?.indices.find((i) => i.name === 'IDX_cp_published_category');
    if (idxPubCat) {
      await queryRunner.dropIndex('caterer_profiles', idxPubCat);
    }
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
    await queryRunner.createIndex(
      'caterer_profiles',
      new TableIndex({
        name: 'IDX_cp_published_category',
        columnNames: ['published', 'category_id'],
      }),
    );

    const idxPubCity = (await queryRunner.getTable('caterer_profiles'))?.indices.find(
      (i) => i.name === 'IDX_cp_published_city',
    );
    if (idxPubCity) {
      await queryRunner.dropIndex('caterer_profiles', idxPubCity);
    }
    const fkCity = (await queryRunner.getTable('caterer_profiles'))?.foreignKeys.find(
      (f) => f.name === 'FK_caterer_profiles_city',
    );
    if (fkCity) {
      await queryRunner.dropForeignKey('caterer_profiles', fkCity);
    }

    await queryRunner.query(`ALTER TABLE \`caterer_profiles\` ADD \`city\` varchar(120) NULL`);
    await queryRunner.query(`ALTER TABLE \`caterer_profiles\` ADD \`state\` varchar(120) NULL`);
    await queryRunner.query(`ALTER TABLE \`caterer_profiles\` ADD \`country\` varchar(80) NULL DEFAULT 'India'`);

    await queryRunner.query(`
      UPDATE \`caterer_profiles\` cp
      INNER JOIN \`cities\` ci ON ci.\`id\` = cp.\`city_id\`
      INNER JOIN \`states\` st ON st.\`id\` = ci.\`state_id\`
      INNER JOIN \`countries\` co ON co.\`id\` = st.\`country_id\`
      SET cp.\`city\` = ci.\`name\`, cp.\`state\` = st.\`name\`, cp.\`country\` = co.\`name\`
      WHERE cp.\`city_id\` IS NOT NULL
    `);

    await queryRunner.query(`ALTER TABLE \`caterer_profiles\` DROP COLUMN \`city_id\``);

    await queryRunner.createIndex(
      'caterer_profiles',
      new TableIndex({
        name: 'IDX_cp_published_city',
        columnNames: ['published', 'city'],
      }),
    );

    await queryRunner.dropTable('cities', true);
    await queryRunner.dropTable('states', true);
    await queryRunner.dropTable('countries', true);
  }
}
