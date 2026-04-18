import { MigrationInterface, QueryRunner } from 'typeorm';

/** Platform database. */
export class EmailVerificationOtp1743210000000 implements MigrationInterface {
  name = 'EmailVerificationOtp1743210000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`email_verification_otp_hash\` varchar(255) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`email_verification_otp_hash\``);
  }
}
