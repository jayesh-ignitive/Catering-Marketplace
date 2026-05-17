import { MigrationInterface, QueryRunner } from 'typeorm';

export class ContactSubmissionSolvedStatus1747050000000 implements MigrationInterface {
  name = 'ContactSubmissionSolvedStatus1747050000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`contact_submissions\`
        ADD COLUMN \`solved\` tinyint(1) NOT NULL DEFAULT 0 AFTER \`message\`,
        ADD COLUMN \`solved_at\` datetime(6) NULL AFTER \`solved\`,
        ADD INDEX \`IDX_contact_submissions_solved\` (\`solved\`)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`contact_submissions\`
        DROP INDEX \`IDX_contact_submissions_solved\`,
        DROP COLUMN \`solved_at\`,
        DROP COLUMN \`solved\`
    `);
  }
}
