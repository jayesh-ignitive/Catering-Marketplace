import { randomUUID } from 'crypto';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { CATALOG_CITY_SEED } from '../../marketplace/seeds/city-i18n.seed';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export class CitySlugTranslationsAndCatalogSeed1747090000000
  implements MigrationInterface
{
  name = 'CitySlugTranslationsAndCatalogSeed1747090000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('cities', 'slug'))) {
      await queryRunner.query(`
        ALTER TABLE \`cities\`
          ADD \`slug\` varchar(120) NULL AFTER \`name\`,
          ADD \`legacy_catalog_id\` varchar(10) NULL AFTER \`slug\`,
          ADD \`display_order\` int NOT NULL DEFAULT 0 AFTER \`legacy_catalog_id\`,
          ADD \`is_active\` tinyint(1) NOT NULL DEFAULT 1 AFTER \`display_order\`
      `);
    }

    const rows = (await queryRunner.query(
      `SELECT \`id\`, \`name\` FROM \`cities\` WHERE \`slug\` IS NULL OR TRIM(\`slug\`) = ''`,
    )) as { id: string; name: string }[];

    const usedSlugs = new Set<string>();
    for (const row of rows) {
      let base = slugify(row.name) || 'city';
      let slug = base;
      let n = 2;
      while (usedSlugs.has(slug)) {
        slug = `${base}-${n++}`;
      }
      usedSlugs.add(slug);
      await queryRunner.query(`UPDATE \`cities\` SET \`slug\` = ? WHERE \`id\` = ?`, [
        slug,
        row.id,
      ]);
    }

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`city_translations\` (
        \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`city_id\` char(36) NOT NULL,
        \`language_id\` bigint unsigned NOT NULL,
        \`name\` varchar(120) NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_city_translation_city_language\` (\`city_id\`, \`language_id\`),
        CONSTRAINT \`FK_city_translations_city\` FOREIGN KEY (\`city_id\`) REFERENCES \`cities\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_city_translations_language\` FOREIGN KEY (\`language_id\`) REFERENCES \`languages\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      INSERT INTO \`city_translations\` (\`city_id\`, \`language_id\`, \`name\`)
      SELECT c.id, l.id, c.name
      FROM \`cities\` c
      INNER JOIN \`languages\` l ON l.code = 'en'
      ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`)
    `);

    const india = (await queryRunner.query(
      `SELECT \`id\` FROM \`countries\` WHERE LOWER(\`name\`) = 'india' LIMIT 1`,
    )) as { id: string }[];
    if (india.length === 0) {
      const indiaId = randomUUID();
      await queryRunner.query(
        `INSERT INTO \`countries\` (\`id\`, \`name\`, \`code\`) VALUES (?, 'India', 'IN')`,
        [indiaId],
      );
      india.push({ id: indiaId });
    }
    const indiaId = india[0]!.id;

    for (const seed of CATALOG_CITY_SEED) {
      const stateId = await this.ensureState(
        queryRunner,
        indiaId,
        seed.stateName,
      );

      const existing = (await queryRunner.query(
        `SELECT \`id\` FROM \`cities\` WHERE \`slug\` = ? OR \`legacy_catalog_id\` = ? OR (\`state_id\` = ? AND \`name\` = ?) LIMIT 1`,
        [seed.slug, seed.legacyCatalogId, stateId, seed.name],
      )) as { id: string }[];

      let cityId: string;
      if (existing.length > 0) {
        cityId = existing[0]!.id;
        await queryRunner.query(
          `UPDATE \`cities\` SET
            \`slug\` = ?,
            \`legacy_catalog_id\` = ?,
            \`display_order\` = ?,
            \`is_active\` = 1,
            \`name\` = ?
          WHERE \`id\` = ?`,
          [seed.slug, seed.legacyCatalogId, seed.displayOrder, seed.name, cityId],
        );
      } else {
        cityId = randomUUID();
        await queryRunner.query(
          `INSERT INTO \`cities\`
            (\`id\`, \`state_id\`, \`name\`, \`slug\`, \`legacy_catalog_id\`, \`display_order\`, \`is_active\`)
          VALUES (?, ?, ?, ?, ?, ?, 1)`,
          [
            cityId,
            stateId,
            seed.name,
            seed.slug,
            seed.legacyCatalogId,
            seed.displayOrder,
          ],
        );
      }

      await queryRunner.query(
        `
        INSERT INTO \`city_translations\` (\`city_id\`, \`language_id\`, \`name\`)
        SELECT ?, l.id, ?
        FROM \`languages\` l WHERE l.code = 'en'
        ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`)
      `,
        [cityId, seed.name],
      );
    }

    const slugIdx = await queryRunner.query(
      `SHOW INDEX FROM \`cities\` WHERE Key_name = 'UQ_cities_slug'`,
    );
    if (!Array.isArray(slugIdx) || slugIdx.length === 0) {
      await queryRunner.query(
        `ALTER TABLE \`cities\` MODIFY \`slug\` varchar(120) NOT NULL`,
      );
      await queryRunner.query(
        `CREATE UNIQUE INDEX \`UQ_cities_slug\` ON \`cities\` (\`slug\`)`,
      );
    }
  }

  private async ensureState(
    queryRunner: QueryRunner,
    countryId: string,
    stateName: string,
  ): Promise<string> {
    const hit = (await queryRunner.query(
      `SELECT \`id\` FROM \`states\` WHERE \`country_id\` = ? AND \`name\` = ? LIMIT 1`,
      [countryId, stateName],
    )) as { id: string }[];
    if (hit.length > 0) {
      return hit[0]!.id;
    }
    const id = randomUUID();
    await queryRunner.query(
      `INSERT INTO \`states\` (\`id\`, \`country_id\`, \`name\`) VALUES (?, ?, ?)`,
      [id, countryId, stateName],
    );
    return id;
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `city_translations`');
    if (await queryRunner.hasColumn('cities', 'slug')) {
      await queryRunner.query(
        `ALTER TABLE \`cities\` DROP INDEX \`UQ_cities_slug\``,
      );
      await queryRunner.query(`
        ALTER TABLE \`cities\`
          DROP COLUMN \`is_active\`,
          DROP COLUMN \`display_order\`,
          DROP COLUMN \`legacy_catalog_id\`,
          DROP COLUMN \`slug\`
      `);
    }
  }
}
