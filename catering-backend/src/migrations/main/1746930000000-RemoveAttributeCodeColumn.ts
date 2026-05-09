import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveAttributeCodeColumn1746930000000 implements MigrationInterface {
  name = 'RemoveAttributeCodeColumn1746930000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `attributes` DROP INDEX `UQ_attributes_type_code`',
    );
    await queryRunner.query('ALTER TABLE `attributes` DROP COLUMN `code`');
  }

  public async down(): Promise<void> {
    // Irreversible without restoring lost codes.
  }
}
