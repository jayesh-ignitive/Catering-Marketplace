import { randomUUID } from 'crypto';
import { MigrationInterface, QueryRunner, TableForeignKey, TableIndex } from 'typeorm';

function slugifyLabel(label: string): string {
  const s = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return s || 'keyword';
}

/**
 * Master `keywords` + `caterer_profile_keywords` junction.
 * Initial data derived from linked cuisines and service offerings (names → keywords).
 */
export class KeywordsAndProfileKeywords1743440000000 implements MigrationInterface {
  name = 'KeywordsAndProfileKeywords1743440000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('keywords')) {
      return;
    }

    await queryRunner.query(`
      CREATE TABLE \`keywords\` (
        \`id\` char(36) NOT NULL,
        \`slug\` varchar(80) NOT NULL,
        \`label\` varchar(120) NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_keywords_slug\` (\`slug\`),
        KEY \`IDX_keywords_label\` (\`label\`(60))
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    try {
      await queryRunner.query(
        `ALTER TABLE \`keywords\` ADD FULLTEXT KEY \`ft_keywords_label\` (\`label\`)`,
      );
    } catch {
      // Older engines / configs without InnoDB FULLTEXT — B-tree slug + junction indexes still apply.
    }

    await queryRunner.query(`
      CREATE TABLE \`caterer_profile_keywords\` (
        \`caterer_profile_id\` char(36) NOT NULL,
        \`keyword_id\` char(36) NOT NULL,
        \`sort_order\` int NOT NULL DEFAULT 0,
        PRIMARY KEY (\`caterer_profile_id\`, \`keyword_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.createIndex(
      'caterer_profile_keywords',
      new TableIndex({ name: 'IDX_cpkw_profile', columnNames: ['caterer_profile_id'] }),
    );
    await queryRunner.createIndex(
      'caterer_profile_keywords',
      new TableIndex({ name: 'IDX_cpkw_keyword', columnNames: ['keyword_id'] }),
    );

    const getOrCreateKeywordId = async (labelRaw: string): Promise<string | null> => {
      const label = labelRaw.trim().slice(0, 120);
      if (!label) {
        return null;
      }
      const byLabel = (await queryRunner.query(`SELECT \`id\` FROM \`keywords\` WHERE \`label\` = ?`, [
        label,
      ])) as { id: string }[];
      if (byLabel.length) {
        return byLabel[0]!.id;
      }
      const base = slugifyLabel(label);
      let slug = base;
      for (let n = 0; n < 50; n++) {
        const bySlug = (await queryRunner.query(
          `SELECT \`id\`, \`label\` FROM \`keywords\` WHERE \`slug\` = ?`,
          [slug],
        )) as { id: string; label: string }[];
        if (!bySlug.length) {
          break;
        }
        if (bySlug[0]!.label === label) {
          return bySlug[0]!.id;
        }
        slug = `${base}-${n + 2}`.slice(0, 80);
      }
      const id = randomUUID();
      await queryRunner.query(
        `INSERT INTO \`keywords\` (\`id\`, \`slug\`, \`label\`, \`created_at\`, \`updated_at\`) VALUES (?, ?, ?, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6))`,
        [id, slug, label],
      );
      return id;
    };

    const cuisineRows = (await queryRunner.query(`
      SELECT DISTINCT pcc.\`caterer_profile_id\` AS pid, c.\`name\` AS label, pcc.\`sort_order\` AS ord
      FROM \`caterer_profile_cuisines\` pcc
      INNER JOIN \`cuisines\` c ON c.\`id\` = pcc.\`cuisine_id\`
    `)) as { pid: string; label: string; ord: number }[];

    let ord = 0;
    for (const r of cuisineRows) {
      const kid = await getOrCreateKeywordId(r.label);
      if (!kid) {
        continue;
      }
      await queryRunner.query(
        `INSERT IGNORE INTO \`caterer_profile_keywords\` (\`caterer_profile_id\`, \`keyword_id\`, \`sort_order\`) VALUES (?, ?, ?)`,
        [r.pid, kid, r.ord ?? ord++],
      );
    }

    const serviceRows = (await queryRunner.query(`
      SELECT DISTINCT pcs.\`caterer_profile_id\` AS pid, s.\`name\` AS label, pcs.\`sort_order\` AS ord
      FROM \`caterer_profile_service_offerings\` pcs
      INNER JOIN \`service_offerings\` s ON s.\`id\` = pcs.\`service_offering_id\`
    `)) as { pid: string; label: string; ord: number }[];

    for (const r of serviceRows) {
      const kid = await getOrCreateKeywordId(r.label);
      if (!kid) {
        continue;
      }
      await queryRunner.query(
        `INSERT IGNORE INTO \`caterer_profile_keywords\` (\`caterer_profile_id\`, \`keyword_id\`, \`sort_order\`) VALUES (?, ?, ?)`,
        [r.pid, kid, 1000 + (r.ord ?? 0)],
      );
    }

    for (const fk of [
      new TableForeignKey({
        name: 'FK_cpkw_profile',
        columnNames: ['caterer_profile_id'],
        referencedTableName: 'caterer_profiles',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        name: 'FK_cpkw_keyword',
        columnNames: ['keyword_id'],
        referencedTableName: 'keywords',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    ]) {
      await queryRunner.createForeignKey('caterer_profile_keywords', fk);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('keywords'))) {
      return;
    }
    await queryRunner.dropTable('caterer_profile_keywords', true);
    await queryRunner.dropTable('keywords', true);
  }
}
