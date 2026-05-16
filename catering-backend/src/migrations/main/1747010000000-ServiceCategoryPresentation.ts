import { MigrationInterface, QueryRunner } from 'typeorm';
import { SERVICE_CATEGORY_PRESENTATION_SEED } from '../../marketplace/service-category-presentation.seed';

export class ServiceCategoryPresentation1747010000000 implements MigrationInterface {
  name = 'ServiceCategoryPresentation1747010000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('categories'))) {
      return;
    }

    const addCol = async (sql: string) => {
      await queryRunner.query(sql);
    };

    if (!(await queryRunner.hasColumn('categories', 'icon_key'))) {
      await addCol(
        `ALTER TABLE \`categories\` ADD \`icon_key\` varchar(40) NOT NULL DEFAULT 'bowl-food'`,
      );
    }
    if (!(await queryRunner.hasColumn('categories', 'image_url'))) {
      await addCol(
        `ALTER TABLE \`categories\` ADD \`image_url\` varchar(512) NULL`,
      );
    }
    if (!(await queryRunner.hasColumn('categories', 'border_class'))) {
      await addCol(
        `ALTER TABLE \`categories\` ADD \`border_class\` varchar(64) NOT NULL DEFAULT 'border-brand-red'`,
      );
    }
    if (!(await queryRunner.hasColumn('categories', 'icon_wrap_class'))) {
      await addCol(
        `ALTER TABLE \`categories\` ADD \`icon_wrap_class\` varchar(255) NOT NULL DEFAULT ''`,
      );
    }
    if (!(await queryRunner.hasColumn('categories', 'title_hover_class'))) {
      await addCol(
        `ALTER TABLE \`categories\` ADD \`title_hover_class\` varchar(64) NOT NULL DEFAULT ''`,
      );
    }
    if (!(await queryRunner.hasColumn('categories', 'display_order'))) {
      await addCol(
        `ALTER TABLE \`categories\` ADD \`display_order\` int NOT NULL DEFAULT 0`,
      );
    }
    if (!(await queryRunner.hasColumn('categories', 'is_active'))) {
      await addCol(
        `ALTER TABLE \`categories\` ADD \`is_active\` tinyint(1) NOT NULL DEFAULT 1`,
      );
    }

    for (const row of SERVICE_CATEGORY_PRESENTATION_SEED) {
      await queryRunner.query(
        `UPDATE \`categories\` SET
          \`icon_key\` = ?,
          \`border_class\` = ?,
          \`icon_wrap_class\` = ?,
          \`title_hover_class\` = ?,
          \`display_order\` = ?,
          \`is_active\` = 1
        WHERE \`code\` = ?`,
        [
          row.iconKey,
          row.borderClass,
          row.iconWrapClass,
          row.titleHoverClass,
          row.displayOrder,
          row.code,
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('categories'))) {
      return;
    }
    const cols = [
      'is_active',
      'display_order',
      'title_hover_class',
      'icon_wrap_class',
      'border_class',
      'image_url',
      'icon_key',
    ];
    for (const col of cols) {
      if (await queryRunner.hasColumn('categories', col)) {
        await queryRunner.query(`ALTER TABLE \`categories\` DROP COLUMN \`${col}\``);
      }
    }
  }
}
