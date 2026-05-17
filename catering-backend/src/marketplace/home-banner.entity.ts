import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type HomeBannerPlacement = 'hero' | 'stats' | 'testimonial';

@Entity('home_banners')
export class HomeBanner {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20 })
  placement!: HomeBannerPlacement;

  @Column({ type: 'varchar', length: 160, nullable: true })
  title!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  subtitle!: string | null;

  /** Relative storage key (`images/home/...`) or legacy full URL. */
  @Column({ name: 'image_key', type: 'varchar', length: 512 })
  imageKey!: string;

  @Column({ name: 'link_href', type: 'varchar', length: 512, nullable: true })
  linkHref!: string | null;

  @Column({ name: 'link_label', type: 'varchar', length: 80, nullable: true })
  linkLabel!: string | null;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;
}
