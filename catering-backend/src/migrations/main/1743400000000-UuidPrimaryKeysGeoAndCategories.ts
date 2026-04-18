import { randomUUID } from 'crypto';
import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

/**
 * Switches `countries`, `states`, `cities`, and `categories` primary keys (and related FKs)
 * from integer autoincrement to CHAR(36) UUIDs for consistency with the rest of the platform.
 */
export class UuidPrimaryKeysGeoAndCategories1743400000000 implements MigrationInterface {
  name = 'UuidPrimaryKeysGeoAndCategories1743400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.migrateCategoriesToUuid(queryRunner);
    await this.migrateGeoToUuid(queryRunner);
  }

  private async migrateCategoriesToUuid(queryRunner: QueryRunner): Promise<void> {
    const [{ dt, cml }] = (await queryRunner.query(`
      SELECT DATA_TYPE AS dt, CHARACTER_MAXIMUM_LENGTH AS cml FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'id'
    `)) as { dt: string; cml: number | null }[];
    const done =
      dt === 'char' ||
      (dt === 'varchar' && Number(cml) === 36) ||
      (dt === 'binary' && Number(cml) === 16);
    if (done) {
      return;
    }

    if (await queryRunner.hasColumn('caterer_profile_categories', 'category_id_uuid')) {
      await queryRunner.query(
        `ALTER TABLE \`caterer_profile_categories\` DROP COLUMN \`category_id_uuid\``,
      );
    }
    if (await queryRunner.hasColumn('categories', 'id_uuid')) {
      await queryRunner.query(`ALTER TABLE \`categories\` DROP COLUMN \`id_uuid\``);
    }

    await queryRunner.query(
      `ALTER TABLE \`caterer_profile_categories\` ADD \`category_id_uuid\` char(36) NULL`,
    );
    await queryRunner.query(`ALTER TABLE \`categories\` ADD \`id_uuid\` char(36) NULL`);

    const cats = (await queryRunner.query(`SELECT \`id\` FROM \`categories\` ORDER BY \`id\``)) as {
      id: number;
    }[];
    for (const { id } of cats) {
      await queryRunner.query(`UPDATE \`categories\` SET \`id_uuid\` = ? WHERE \`id\` = ?`, [
        randomUUID(),
        id,
      ]);
    }

    await queryRunner.query(`
      UPDATE \`caterer_profile_categories\` cpc
      INNER JOIN \`categories\` c ON c.\`id\` = cpc.\`category_id\`
      SET cpc.\`category_id_uuid\` = c.\`id_uuid\`
    `);

    const cpcTbl = await queryRunner.getTable('caterer_profile_categories');
    for (const fk of cpcTbl?.foreignKeys ?? []) {
      await queryRunner.dropForeignKey('caterer_profile_categories', fk);
    }

    await queryRunner.query(`ALTER TABLE \`caterer_profile_categories\` DROP PRIMARY KEY`);
    await queryRunner.query(`ALTER TABLE \`caterer_profile_categories\` DROP COLUMN \`category_id\``);
    await queryRunner.query(
      `ALTER TABLE \`caterer_profile_categories\` CHANGE \`category_id_uuid\` \`category_id\` char(36) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`caterer_profile_categories\` ADD PRIMARY KEY (\`caterer_profile_id\`, \`category_id\`)`,
    );

    await queryRunner.query(`ALTER TABLE \`categories\` MODIFY \`id\` smallint unsigned NOT NULL`);
    await queryRunner.query(`ALTER TABLE \`categories\` DROP PRIMARY KEY`);
    await queryRunner.query(`ALTER TABLE \`categories\` DROP COLUMN \`id\``);
    await queryRunner.query(
      `ALTER TABLE \`categories\` CHANGE \`id_uuid\` \`id\` char(36) NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE \`categories\` ADD PRIMARY KEY (\`id\`)`);

    await queryRunner.createForeignKey(
      'caterer_profile_categories',
      new TableForeignKey({
        name: 'FK_cpc_caterer_profile',
        columnNames: ['caterer_profile_id'],
        referencedTableName: 'caterer_profiles',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'caterer_profile_categories',
      new TableForeignKey({
        name: 'FK_cpc_category_uuid',
        columnNames: ['category_id'],
        referencedTableName: 'categories',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  private async migrateGeoToUuid(queryRunner: QueryRunner): Promise<void> {
    const [{ dt, cml }] = (await queryRunner.query(`
      SELECT DATA_TYPE AS dt, CHARACTER_MAXIMUM_LENGTH AS cml FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'countries' AND COLUMN_NAME = 'id'
    `)) as { dt: string; cml: number | null }[];
    const done =
      dt === 'char' ||
      (dt === 'varchar' && Number(cml) === 36) ||
      (dt === 'binary' && Number(cml) === 16);
    if (done) {
      return;
    }

    const cpTbl = await queryRunner.getTable('caterer_profiles');
    const fkCpCity = cpTbl?.foreignKeys.find((f) => f.name === 'FK_caterer_profiles_city');
    if (fkCpCity) {
      await queryRunner.dropForeignKey('caterer_profiles', fkCpCity);
    }

    const citiesTbl = await queryRunner.getTable('cities');
    const fkCityState = citiesTbl?.foreignKeys.find((f) => f.columnNames.includes('state_id'));
    if (fkCityState) {
      await queryRunner.dropForeignKey('cities', fkCityState);
    }

    const statesTbl = await queryRunner.getTable('states');
    const fkStateCountry = statesTbl?.foreignKeys.find((f) => f.columnNames.includes('country_id'));
    if (fkStateCountry) {
      await queryRunner.dropForeignKey('states', fkStateCountry);
    }

    if (!(await queryRunner.hasColumn('countries', 'id_uuid'))) {
      await queryRunner.query(`ALTER TABLE \`countries\` ADD \`id_uuid\` char(36) NULL`);
    }
    const countriesNeed = (await queryRunner.query(
      `SELECT \`id\` FROM \`countries\` WHERE \`id_uuid\` IS NULL ORDER BY \`id\``,
    )) as { id: number }[];
    for (const { id } of countriesNeed) {
      await queryRunner.query(`UPDATE \`countries\` SET \`id_uuid\` = ? WHERE \`id\` = ?`, [
        randomUUID(),
        id,
      ]);
    }
    const coTbl = await queryRunner.getTable('countries');
    if (!coTbl?.indices.some((i) => i.name === 'UQ_countries_id_uuid')) {
      await queryRunner.query(
        `ALTER TABLE \`countries\` ADD UNIQUE INDEX \`UQ_countries_id_uuid\` (\`id_uuid\`)`,
      );
    }

    if (!(await queryRunner.hasColumn('states', 'country_id_uuid'))) {
      await queryRunner.query(`ALTER TABLE \`states\` ADD \`country_id_uuid\` char(36) NULL`);
    }
    if (!(await queryRunner.hasColumn('states', 'id_uuid'))) {
      await queryRunner.query(`ALTER TABLE \`states\` ADD \`id_uuid\` char(36) NULL`);
    }
    await queryRunner.query(`
      UPDATE \`states\` st
      INNER JOIN \`countries\` co ON co.\`id\` = st.\`country_id\`
      SET st.\`country_id_uuid\` = co.\`id_uuid\`
      WHERE st.\`country_id_uuid\` IS NULL
    `);
    const statesNeed = (await queryRunner.query(
      `SELECT \`id\` FROM \`states\` WHERE \`id_uuid\` IS NULL ORDER BY \`id\``,
    )) as { id: number }[];
    for (const { id } of statesNeed) {
      await queryRunner.query(`UPDATE \`states\` SET \`id_uuid\` = ? WHERE \`id\` = ?`, [randomUUID(), id]);
    }
    const stTbl = await queryRunner.getTable('states');
    if (!stTbl?.indices.some((i) => i.name === 'UQ_states_id_uuid')) {
      await queryRunner.query(
        `ALTER TABLE \`states\` ADD UNIQUE INDEX \`UQ_states_id_uuid\` (\`id_uuid\`)`,
      );
    }

    if (!(await queryRunner.hasColumn('cities', 'state_id_uuid'))) {
      await queryRunner.query(`ALTER TABLE \`cities\` ADD \`state_id_uuid\` char(36) NULL`);
    }
    if (!(await queryRunner.hasColumn('cities', 'id_uuid'))) {
      await queryRunner.query(`ALTER TABLE \`cities\` ADD \`id_uuid\` char(36) NULL`);
    }
    await queryRunner.query(`
      UPDATE \`cities\` ci
      INNER JOIN \`states\` st ON st.\`id\` = ci.\`state_id\`
      SET ci.\`state_id_uuid\` = st.\`id_uuid\`
      WHERE ci.\`state_id_uuid\` IS NULL
    `);
    const citiesNeed = (await queryRunner.query(
      `SELECT \`id\` FROM \`cities\` WHERE \`id_uuid\` IS NULL ORDER BY \`id\``,
    )) as { id: number }[];
    for (const { id } of citiesNeed) {
      await queryRunner.query(`UPDATE \`cities\` SET \`id_uuid\` = ? WHERE \`id\` = ?`, [randomUUID(), id]);
    }
    const ciTbl = await queryRunner.getTable('cities');
    if (!ciTbl?.indices.some((i) => i.name === 'UQ_cities_id_uuid')) {
      await queryRunner.query(
        `ALTER TABLE \`cities\` ADD UNIQUE INDEX \`UQ_cities_id_uuid\` (\`id_uuid\`)`,
      );
    }

    const [{ cpCityDt }] = (await queryRunner.query(`
      SELECT DATA_TYPE AS cpCityDt FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'caterer_profiles' AND COLUMN_NAME = 'city_id'
    `)) as { cpCityDt: string }[];
    const cityIdAlreadyUuid =
      cpCityDt === 'char' || cpCityDt === 'varchar' || cpCityDt === 'binary';

    if (!cityIdAlreadyUuid) {
      if (!(await queryRunner.hasColumn('caterer_profiles', 'city_id_uuid'))) {
        await queryRunner.query(`ALTER TABLE \`caterer_profiles\` ADD \`city_id_uuid\` char(36) NULL`);
      }
      await queryRunner.query(`
        UPDATE \`caterer_profiles\` cp
        INNER JOIN \`cities\` ci ON ci.\`id\` = cp.\`city_id\`
        SET cp.\`city_id_uuid\` = ci.\`id_uuid\`
        WHERE cp.\`city_id\` IS NOT NULL
      `);
      await queryRunner.query(`ALTER TABLE \`caterer_profiles\` DROP COLUMN \`city_id\``);
      await queryRunner.query(
        `ALTER TABLE \`caterer_profiles\` CHANGE \`city_id_uuid\` \`city_id\` char(36) NULL`,
      );
    }

    const [{ citiesPkType }] = (await queryRunner.query(`
      SELECT DATA_TYPE AS citiesPkType FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cities' AND COLUMN_NAME = 'id'
    `)) as { citiesPkType: string }[];
    if (
      citiesPkType === 'char' ||
      citiesPkType === 'varchar' ||
      citiesPkType === 'binary'
    ) {
      await this.ensureGeoForeignKeysAndUniques(queryRunner);
      return;
    }

    await queryRunner.query(`ALTER TABLE \`cities\` MODIFY \`id\` int unsigned NOT NULL`);
    await queryRunner.query(`ALTER TABLE \`cities\` DROP PRIMARY KEY`);
    await queryRunner.query(`ALTER TABLE \`cities\` DROP COLUMN \`id\``);
    await queryRunner.query(`ALTER TABLE \`cities\` DROP COLUMN \`state_id\``);
    await queryRunner.query(
      `ALTER TABLE \`cities\` CHANGE \`id_uuid\` \`id\` char(36) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`cities\` CHANGE \`state_id_uuid\` \`state_id\` char(36) NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE \`cities\` ADD PRIMARY KEY (\`id\`)`);
    await queryRunner.query(`ALTER TABLE \`cities\` DROP INDEX \`UQ_cities_id_uuid\``);

    await queryRunner.query(`ALTER TABLE \`states\` MODIFY \`id\` smallint unsigned NOT NULL`);
    await queryRunner.query(`ALTER TABLE \`states\` DROP PRIMARY KEY`);
    await queryRunner.query(`ALTER TABLE \`states\` DROP COLUMN \`id\``);
    await queryRunner.query(`ALTER TABLE \`states\` DROP COLUMN \`country_id\``);
    await queryRunner.query(
      `ALTER TABLE \`states\` CHANGE \`id_uuid\` \`id\` char(36) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`states\` CHANGE \`country_id_uuid\` \`country_id\` char(36) NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE \`states\` ADD PRIMARY KEY (\`id\`)`);
    await queryRunner.query(`ALTER TABLE \`states\` DROP INDEX \`UQ_states_id_uuid\``);

    await queryRunner.query(`ALTER TABLE \`countries\` MODIFY \`id\` smallint unsigned NOT NULL`);
    await queryRunner.query(`ALTER TABLE \`countries\` DROP PRIMARY KEY`);
    await queryRunner.query(`ALTER TABLE \`countries\` DROP COLUMN \`id\``);
    await queryRunner.query(
      `ALTER TABLE \`countries\` CHANGE \`id_uuid\` \`id\` char(36) NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE \`countries\` ADD PRIMARY KEY (\`id\`)`);
    await queryRunner.query(`ALTER TABLE \`countries\` DROP INDEX \`UQ_countries_id_uuid\``);

    await this.ensureGeoForeignKeysAndUniques(queryRunner);
  }

  private async ensureGeoForeignKeysAndUniques(queryRunner: QueryRunner): Promise<void> {
    const st = await queryRunner.getTable('states');
    if (!st?.foreignKeys.some((f) => f.name === 'FK_states_country_uuid')) {
      await queryRunner.createForeignKey(
        'states',
        new TableForeignKey({
          name: 'FK_states_country_uuid',
          columnNames: ['country_id'],
          referencedTableName: 'countries',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
    }
    const ci = await queryRunner.getTable('cities');
    if (!ci?.foreignKeys.some((f) => f.name === 'FK_cities_state_uuid')) {
      await queryRunner.createForeignKey(
        'cities',
        new TableForeignKey({
          name: 'FK_cities_state_uuid',
          columnNames: ['state_id'],
          referencedTableName: 'states',
          referencedColumnNames: ['id'],
          onDelete: 'RESTRICT',
        }),
      );
    }
    const cp = await queryRunner.getTable('caterer_profiles');
    if (!cp?.foreignKeys.some((f) => f.name === 'FK_caterer_profiles_city')) {
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
    }

    const st2 = await queryRunner.getTable('states');
    if (!st2?.indices.some((i) => i.name === 'UQ_states_country_name')) {
      await queryRunner.query(
        `CREATE UNIQUE INDEX \`UQ_states_country_name\` ON \`states\` (\`country_id\`, \`name\`)`,
      );
    }
    const ci2 = await queryRunner.getTable('cities');
    if (!ci2?.indices.some((i) => i.name === 'UQ_cities_state_name')) {
      await queryRunner.query(
        `CREATE UNIQUE INDEX \`UQ_cities_state_name\` ON \`cities\` (\`state_id\`, \`name\`)`,
      );
    }
  }

  public async down(): Promise<void> {
    // Irreversible without restoring integer id maps; use DB backup to revert.
  }
}
