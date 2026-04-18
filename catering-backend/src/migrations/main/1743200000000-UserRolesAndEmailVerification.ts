import { MigrationInterface, QueryRunner } from 'typeorm';

/** Platform database — users, auth, tenants registry. */
export class UserRolesAndEmailVerification1743200000000 implements MigrationInterface {
  name = 'UserRolesAndEmailVerification1743200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`role\` varchar(20) NOT NULL DEFAULT 'caterer'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`email_verified_at\` datetime(6) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`email_verification_token\` varchar(64) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`email_verification_expires_at\` datetime(6) NULL`,
    );
    await queryRunner.query(
      `UPDATE \`users\` SET \`email_verified_at\` = CURRENT_TIMESTAMP(6) WHERE \`email_verified_at\` IS NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`UQ_users_email_verification_token\` ON \`users\` (\`email_verification_token\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`UQ_users_email_verification_token\` ON \`users\``);
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`email_verification_expires_at\``);
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`email_verification_token\``);
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`email_verified_at\``);
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`role\``);
  }
}
