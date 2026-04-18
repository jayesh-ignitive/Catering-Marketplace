import { MigrationInterface, QueryRunner } from 'typeorm';

export class ContactSubmissions1743600000000 implements MigrationInterface {
  name = 'ContactSubmissions1743600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`contact_submissions\` (
        \`id\` char(36) NOT NULL,
        \`name\` varchar(120) NOT NULL,
        \`email\` varchar(255) NOT NULL,
        \`phone\` varchar(32) NULL,
        \`subject\` varchar(200) NOT NULL,
        \`message\` text NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_contact_submissions_created_at\` (\`created_at\`),
        INDEX \`IDX_contact_submissions_email\` (\`email\`)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`contact_submissions\``);
  }
}
