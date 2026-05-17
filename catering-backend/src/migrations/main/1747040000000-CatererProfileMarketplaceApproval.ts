import { MigrationInterface, QueryRunner } from 'typeorm';

export class CatererProfileMarketplaceApproval1747040000000 implements MigrationInterface {
  name = 'CatererProfileMarketplaceApproval1747040000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`caterer_profiles\`
        ADD COLUMN \`approval_status\` varchar(20) NOT NULL DEFAULT 'draft' AFTER \`published\`,
        ADD COLUMN \`submitted_for_review_at\` datetime(6) NULL AFTER \`approval_status\`,
        ADD COLUMN \`reviewed_at\` datetime(6) NULL AFTER \`submitted_for_review_at\`,
        ADD COLUMN \`reviewed_by_user_id\` char(36) NULL AFTER \`reviewed_at\`,
        ADD INDEX \`IDX_caterer_profiles_approval_status\` (\`approval_status\`)
    `);

    await queryRunner.query(`
      UPDATE \`caterer_profiles\`
      SET \`approval_status\` = 'approved'
      WHERE \`published\` = 1
    `);

    await queryRunner.query(`
      UPDATE \`tenants\` t
      INNER JOIN \`caterer_profiles\` cp ON cp.tenant_id = t.id
      SET t.profile_published = 1
      WHERE cp.published = 1
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`caterer_profiles\`
        DROP INDEX \`IDX_caterer_profiles_approval_status\`,
        DROP COLUMN \`reviewed_by_user_id\`,
        DROP COLUMN \`reviewed_at\`,
        DROP COLUMN \`submitted_for_review_at\`,
        DROP COLUMN \`approval_status\`
    `);
  }
}
