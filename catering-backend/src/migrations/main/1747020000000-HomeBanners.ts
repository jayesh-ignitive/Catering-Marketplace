import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class HomeBanners1747020000000 implements MigrationInterface {
  name = 'HomeBanners1747020000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'home_banners',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'placement',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '160',
            isNullable: true,
          },
          {
            name: 'subtitle',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'image_key',
            type: 'varchar',
            length: '512',
          },
          {
            name: 'link_href',
            type: 'varchar',
            length: '512',
            isNullable: true,
          },
          {
            name: 'link_label',
            type: 'varchar',
            length: '80',
            isNullable: true,
          },
          {
            name: 'display_order',
            type: 'int',
            default: 0,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
            onUpdate: 'CURRENT_TIMESTAMP(6)',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'home_banners',
      new TableIndex({
        name: 'IDX_home_banners_placement_active_order',
        columnNames: ['placement', 'is_active', 'display_order'],
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('home_banners', true);
  }
}
