import { MigrationInterface, QueryRunner } from 'typeorm';

export class LanguagesSoftDelete1746810000000 implements MigrationInterface {
  name = 'LanguagesSoftDelete1746810000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('languages', 'deleted_at');
    if (!hasColumn) {
      await queryRunner.query(
        'ALTER TABLE `languages` ADD `deleted_at` datetime(6) NULL',
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('languages', 'deleted_at');
    if (hasColumn) {
      await queryRunner.query(
        'ALTER TABLE `languages` DROP COLUMN `deleted_at`',
      );
    }
  }
}
