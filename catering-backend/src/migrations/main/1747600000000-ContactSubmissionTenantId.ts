import { MigrationInterface, QueryRunner } from 'typeorm';

export class ContactSubmissionTenantId1747600000000 implements MigrationInterface {
  name = 'ContactSubmissionTenantId1747600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`contact_submissions\`
        ADD COLUMN \`tenant_id\` char(36) NULL AFTER \`message\`,
        ADD INDEX \`IDX_contact_submissions_tenant_id\` (\`tenant_id\`),
        ADD CONSTRAINT \`FK_contact_submissions_tenant\`
          FOREIGN KEY (\`tenant_id\`) REFERENCES \`tenants\`(\`id\`)
          ON DELETE SET NULL ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`contact_submissions\`
        DROP FOREIGN KEY \`FK_contact_submissions_tenant\`,
        DROP INDEX \`IDX_contact_submissions_tenant_id\`,
        DROP COLUMN \`tenant_id\`
    `);
  }
}
