import { MigrationInterface, QueryRunner } from 'typeorm';

export class CatererProfilePriceTo1747500000000 implements MigrationInterface {
  name = 'CatererProfilePriceTo1747500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`caterer_profiles\` ADD \`price_to\` decimal(12,2) NULL AFTER \`price_from\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`caterer_profiles\` DROP COLUMN \`price_to\``,
    );
  }
}
