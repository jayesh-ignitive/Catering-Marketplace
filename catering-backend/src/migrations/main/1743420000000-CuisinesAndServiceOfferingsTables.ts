import { randomUUID } from 'crypto';
import { MigrationInterface, QueryRunner, TableForeignKey, TableIndex } from 'typeorm';

/**
 * Replaces JSON `cuisines` / `services_offered` on `caterer_profiles` with
 * `cuisines`, `service_offerings` lookup tables and junction tables keyed by UUID.
 */
export class CuisinesAndServiceOfferingsTables1743420000000 implements MigrationInterface {
  name = 'CuisinesAndServiceOfferingsTables1743420000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('caterer_profiles', 'cuisines'))) {
      return;
    }

    await queryRunner.query(`
      CREATE TABLE \`cuisines\` (
        \`id\` char(36) NOT NULL,
        \`name\` varchar(120) NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_cuisines_name\` (\`name\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`service_offerings\` (
        \`id\` char(36) NOT NULL,
        \`name\` varchar(160) NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_service_offerings_name\` (\`name\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`caterer_profile_cuisines\` (
        \`caterer_profile_id\` char(36) NOT NULL,
        \`cuisine_id\` char(36) NOT NULL,
        \`sort_order\` int NOT NULL DEFAULT 0,
        PRIMARY KEY (\`caterer_profile_id\`, \`cuisine_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`caterer_profile_service_offerings\` (
        \`caterer_profile_id\` char(36) NOT NULL,
        \`service_offering_id\` char(36) NOT NULL,
        \`sort_order\` int NOT NULL DEFAULT 0,
        PRIMARY KEY (\`caterer_profile_id\`, \`service_offering_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.createIndex(
      'caterer_profile_cuisines',
      new TableIndex({ name: 'IDX_cpcuisines_profile', columnNames: ['caterer_profile_id'] }),
    );
    await queryRunner.createIndex(
      'caterer_profile_service_offerings',
      new TableIndex({
        name: 'IDX_cpsvc_profile',
        columnNames: ['caterer_profile_id'],
      }),
    );

    const cuisineIds = new Map<string, string>();
    const serviceIds = new Map<string, string>();

    const getOrCreateCuisineId = async (label: string): Promise<string> => {
      const name = label.trim().slice(0, 120);
      if (!name) {
        return '';
      }
      const hit = cuisineIds.get(name);
      if (hit) {
        return hit;
      }
      const rows = (await queryRunner.query(`SELECT \`id\` FROM \`cuisines\` WHERE \`name\` = ?`, [
        name,
      ])) as { id: string }[];
      if (rows.length) {
        cuisineIds.set(name, rows[0]!.id);
        return rows[0]!.id;
      }
      const id = randomUUID();
      await queryRunner.query(
        `INSERT INTO \`cuisines\` (\`id\`, \`name\`, \`created_at\`, \`updated_at\`) VALUES (?, ?, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6))`,
        [id, name],
      );
      cuisineIds.set(name, id);
      return id;
    };

    const getOrCreateServiceId = async (label: string): Promise<string> => {
      const name = label.trim().slice(0, 160);
      if (!name) {
        return '';
      }
      const hit = serviceIds.get(name);
      if (hit) {
        return hit;
      }
      const rows = (await queryRunner.query(
        `SELECT \`id\` FROM \`service_offerings\` WHERE \`name\` = ?`,
        [name],
      )) as { id: string }[];
      if (rows.length) {
        serviceIds.set(name, rows[0]!.id);
        return rows[0]!.id;
      }
      const id = randomUUID();
      await queryRunner.query(
        `INSERT INTO \`service_offerings\` (\`id\`, \`name\`, \`created_at\`, \`updated_at\`) VALUES (?, ?, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6))`,
        [id, name],
      );
      serviceIds.set(name, id);
      return id;
    };

    const profiles = (await queryRunner.query(
      `SELECT \`id\`, \`cuisines\`, \`services_offered\` FROM \`caterer_profiles\``,
    )) as { id: string; cuisines: unknown; services_offered: unknown }[];

    for (const p of profiles) {
      const cuisineLabels = this.parseJsonStringArray(p.cuisines);
      let ord = 0;
      for (const lab of cuisineLabels) {
        const cid = await getOrCreateCuisineId(lab);
        if (!cid) {
          continue;
        }
        await queryRunner.query(
          `INSERT IGNORE INTO \`caterer_profile_cuisines\` (\`caterer_profile_id\`, \`cuisine_id\`, \`sort_order\`) VALUES (?, ?, ?)`,
          [p.id, cid, ord++],
        );
      }

      const serviceLabels = this.parseJsonStringArray(p.services_offered);
      ord = 0;
      for (const lab of serviceLabels) {
        const sid = await getOrCreateServiceId(lab);
        if (!sid) {
          continue;
        }
        await queryRunner.query(
          `INSERT IGNORE INTO \`caterer_profile_service_offerings\` (\`caterer_profile_id\`, \`service_offering_id\`, \`sort_order\`) VALUES (?, ?, ?)`,
          [p.id, sid, ord++],
        );
      }
    }

    for (const fk of [
      new TableForeignKey({
        name: 'FK_cpcuisines_profile',
        columnNames: ['caterer_profile_id'],
        referencedTableName: 'caterer_profiles',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        name: 'FK_cpcuisines_cuisine',
        columnNames: ['cuisine_id'],
        referencedTableName: 'cuisines',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    ]) {
      await queryRunner.createForeignKey('caterer_profile_cuisines', fk);
    }

    for (const fk of [
      new TableForeignKey({
        name: 'FK_cpsvc_profile',
        columnNames: ['caterer_profile_id'],
        referencedTableName: 'caterer_profiles',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        name: 'FK_cpsvc_service',
        columnNames: ['service_offering_id'],
        referencedTableName: 'service_offerings',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    ]) {
      await queryRunner.createForeignKey('caterer_profile_service_offerings', fk);
    }

    await queryRunner.query(`ALTER TABLE \`caterer_profiles\` DROP COLUMN \`cuisines\``);
    await queryRunner.query(`ALTER TABLE \`caterer_profiles\` DROP COLUMN \`services_offered\``);
  }

  private parseJsonStringArray(raw: unknown): string[] {
    if (raw == null) {
      return [];
    }
    if (Array.isArray(raw)) {
      return raw
        .filter((x): x is string => typeof x === 'string')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (typeof raw === 'string') {
      try {
        return this.parseJsonStringArray(JSON.parse(raw) as unknown);
      } catch {
        return [];
      }
    }
    return [];
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('caterer_profiles', 'cuisines')) {
      return;
    }
    await queryRunner.query(`ALTER TABLE \`caterer_profiles\` ADD \`cuisines\` json NULL`);
    await queryRunner.query(`ALTER TABLE \`caterer_profiles\` ADD \`services_offered\` json NULL`);

    const rows = (await queryRunner.query(
      `SELECT \`caterer_profile_id\`, \`cuisine_id\`, \`sort_order\` FROM \`caterer_profile_cuisines\` ORDER BY \`caterer_profile_id\`, \`sort_order\``,
    )) as { caterer_profile_id: string; cuisine_id: string; sort_order: number }[];
    const cMap = new Map<string, string[]>();
    for (const r of rows) {
      const [n] = (await queryRunner.query(`SELECT \`name\` FROM \`cuisines\` WHERE \`id\` = ?`, [
        r.cuisine_id,
      ])) as { name: string }[];
      if (!n) {
        continue;
      }
      const list = cMap.get(r.caterer_profile_id) ?? [];
      list.push(n.name);
      cMap.set(r.caterer_profile_id, list);
    }
    for (const [pid, names] of cMap) {
      await queryRunner.query(`UPDATE \`caterer_profiles\` SET \`cuisines\` = ? WHERE \`id\` = ?`, [
        JSON.stringify(names),
        pid,
      ]);
    }

    const srows = (await queryRunner.query(
      `SELECT \`caterer_profile_id\`, \`service_offering_id\`, \`sort_order\` FROM \`caterer_profile_service_offerings\` ORDER BY \`caterer_profile_id\`, \`sort_order\``,
    )) as { caterer_profile_id: string; service_offering_id: string; sort_order: number }[];
    const sMap = new Map<string, string[]>();
    for (const r of srows) {
      const [n] = (await queryRunner.query(
        `SELECT \`name\` FROM \`service_offerings\` WHERE \`id\` = ?`,
        [r.service_offering_id],
      )) as { name: string }[];
      if (!n) {
        continue;
      }
      const list = sMap.get(r.caterer_profile_id) ?? [];
      list.push(n.name);
      sMap.set(r.caterer_profile_id, list);
    }
    for (const [pid, names] of sMap) {
      await queryRunner.query(
        `UPDATE \`caterer_profiles\` SET \`services_offered\` = ? WHERE \`id\` = ?`,
        [JSON.stringify(names), pid],
      );
    }

    await queryRunner.dropTable('caterer_profile_service_offerings', true);
    await queryRunner.dropTable('caterer_profile_cuisines', true);
    await queryRunner.dropTable('service_offerings', true);
    await queryRunner.dropTable('cuisines', true);
  }
}
