import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Caterer registration profile on `users`; routing hint `tenants.subdomain` (e.g. acme.app.com).
 * Idempotent: skips columns that already exist.
 */
export class UserBusinessPhoneTenantSubdomain1743310000000 implements MigrationInterface {
  name = 'UserBusinessPhoneTenantSubdomain1743310000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const userCols = [
      new TableColumn({
        name: 'business_name',
        type: 'varchar',
        length: '120',
        isNullable: true,
      }),
      new TableColumn({
        name: 'phone_country_code',
        type: 'varchar',
        length: '8',
        isNullable: true,
      }),
      new TableColumn({
        name: 'phone_number',
        type: 'varchar',
        length: '24',
        isNullable: true,
      }),
    ];

    for (const col of userCols) {
      if (!(await queryRunner.hasColumn('users', col.name))) {
        await queryRunner.addColumn('users', col);
      }
    }

    if (!(await queryRunner.hasColumn('tenants', 'subdomain'))) {
      await queryRunner.addColumn(
        'tenants',
        new TableColumn({
          name: 'subdomain',
          type: 'varchar',
          length: '63',
          isNullable: true,
          isUnique: true,
        }),
      );
    }

    const tenants = (await queryRunner.query(
      `SELECT \`id\`, \`slug\` FROM \`tenants\` WHERE \`subdomain\` IS NULL`,
    )) as { id: string; slug: string }[];

    const taken = new Set<string>();
    for (const t of tenants) {
      let base = (t.slug || 'catering').toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '') || 'catering';
      base = base.slice(0, 63);
      let candidate = base;
      let n = 0;
      while (taken.has(candidate)) {
        n += 1;
        const suffix = `-${n}`;
        candidate = `${base.slice(0, Math.max(1, 63 - suffix.length))}${suffix}`;
      }
      taken.add(candidate);
      await queryRunner.query(`UPDATE \`tenants\` SET \`subdomain\` = ? WHERE \`id\` = ?`, [
        candidate,
        t.id,
      ]);
    }

    await queryRunner.query(
      `UPDATE \`users\` u INNER JOIN \`tenants\` t ON t.\`id\` = u.\`tenant_id\` SET u.\`business_name\` = t.\`name\` WHERE u.\`business_name\` IS NULL AND u.\`tenant_id\` IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('tenants', 'subdomain')) {
      await queryRunner.dropColumn('tenants', 'subdomain');
    }
    if (await queryRunner.hasColumn('users', 'phone_number')) {
      await queryRunner.dropColumn('users', 'phone_number');
    }
    if (await queryRunner.hasColumn('users', 'phone_country_code')) {
      await queryRunner.dropColumn('users', 'phone_country_code');
    }
    if (await queryRunner.hasColumn('users', 'business_name')) {
      await queryRunner.dropColumn('users', 'business_name');
    }
  }
}
