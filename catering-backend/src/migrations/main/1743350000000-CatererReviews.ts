import { randomUUID } from 'crypto';
import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CatererReviews1743350000000 implements MigrationInterface {
  name = 'CatererReviews1743350000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const has = await queryRunner.hasTable('caterer_reviews');
    if (!has) {
      await queryRunner.createTable(
        new Table({
          name: 'caterer_reviews',
          columns: [
            { name: 'id', type: 'char', length: '36', isPrimary: true },
            { name: 'tenant_id', type: 'char', length: '36', isNullable: false },
            { name: 'author_name', type: 'varchar', length: '120', isNullable: false },
            { name: 'rating', type: 'tinyint', unsigned: true, isNullable: false },
            { name: 'title', type: 'varchar', length: '200', isNullable: true },
            { name: 'comment', type: 'text', isNullable: false },
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
        'caterer_reviews',
        new TableForeignKey({
          columnNames: ['tenant_id'],
          referencedTableName: 'tenants',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createIndex(
        'caterer_reviews',
        new TableIndex({
          name: 'IDX_cr_tenant_created',
          columnNames: ['tenant_id', 'created_at'],
        }),
      );
    }

    const [{ cnt }] = (await queryRunner.query(
      `SELECT COUNT(*) AS cnt FROM \`caterer_reviews\``,
    )) as { cnt: number | string }[];
    if (Number(cnt) > 0) {
      await this.syncProfileAggregates(queryRunner);
      return;
    }

    const tenants = (await queryRunner.query(
      `SELECT \`id\` FROM \`tenants\` WHERE \`slug\` LIKE 'ahm-demo-%' ORDER BY \`slug\` ASC`,
    )) as { id: string }[];

    const authors = [
      'Priya S.',
      'Rahul M.',
      'Neha K.',
      'Vikram P.',
      'Anjali R.',
      'Karan D.',
      'Meera J.',
      'Arjun T.',
      'Sneha G.',
      'Dhruv B.',
    ];

    const titles = [
      'Excellent wedding spread',
      'Corporate lunch went smoothly',
      'Highly professional team',
      'Guests loved the thali',
      'On time and hygienic',
      'Great value for money',
      'Would book again',
      'Live counters were a hit',
    ];

    const bodies = [
      'Food quality was consistently good across all counters. Service staff was polite and the setup looked premium.',
      'We used them for a 200-guest reception in Ahmedabad. Jain options were handled carefully and portions were generous.',
      'Timely arrival, clean packaging for office lunch, and the menu had enough variety for our mixed team.',
      'Buffet was well laid out, refill was prompt, and the dessert section was especially appreciated by elders.',
      'Coordinated well with our decorator and stuck to the timeline. Billing was transparent with no surprises.',
      'Taste was homely and authentic. Several relatives asked for their contact after the function.',
      'Good communication on WhatsApp, sample tasting was arranged, and they delivered exactly what was promised.',
    ];

    for (let ti = 0; ti < tenants.length; ti++) {
      const tid = tenants[ti]!.id;
      const n = 2 + (ti % 2);
      for (let r = 0; r < n; r++) {
        const seed = ti * 10 + r;
        const rating = 4 + ((seed % 5 === 0 ? 0 : 1) % 2);
        await queryRunner.query(
          `INSERT INTO \`caterer_reviews\` (
            \`id\`, \`tenant_id\`, \`author_name\`, \`rating\`, \`title\`, \`comment\`, \`created_at\`, \`updated_at\`
          ) VALUES (?, ?, ?, ?, ?, ?, DATE_SUB(NOW(6), INTERVAL ? DAY), DATE_SUB(NOW(6), INTERVAL ? DAY))`,
          [
            randomUUID(),
            tid,
            authors[seed % authors.length]!,
            rating,
            titles[seed % titles.length]!,
            bodies[seed % bodies.length]!,
            3 + (seed % 60),
            3 + (seed % 60),
          ],
        );
      }
    }

    await this.syncProfileAggregates(queryRunner);
  }

  private async syncProfileAggregates(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
UPDATE \`caterer_profiles\` cp
INNER JOIN (
  SELECT \`tenant_id\`, ROUND(AVG(\`rating\`), 1) AS \`avg_r\`, COUNT(*) AS \`cnt\`
  FROM \`caterer_reviews\`
  GROUP BY \`tenant_id\`
) x ON x.\`tenant_id\` = cp.\`tenant_id\`
SET cp.\`avg_rating\` = x.\`avg_r\`, cp.\`review_count\` = x.\`cnt\`
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('caterer_reviews')) {
      await queryRunner.dropTable('caterer_reviews', true);
    }
  }
}
