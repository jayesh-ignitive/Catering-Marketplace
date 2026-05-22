import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CategoryTranslation } from './category-translation.entity';

/** Marketplace service category (replaces free-form `primary_category_id` codes on profiles). */
@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Stable API id, e.g. `c1`, matching legacy marketplace filters. */
  @Column({ type: 'varchar', length: 32, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 120, unique: true })
  slug!: string;

  @Column({ name: 'short_description', type: 'varchar', length: 255 })
  shortDescription!: string;

  /** Phosphor icon key for marketing cards (e.g. `bowl-food`). */
  @Column({ name: 'icon_key', type: 'varchar', length: 40, default: 'bowl-food' })
  iconKey!: string;

  @Column({ name: 'image_url', type: 'varchar', length: 512, nullable: true })
  imageUrl!: string | null;

  @Column({ name: 'border_class', type: 'varchar', length: 64, default: 'border-brand-red' })
  borderClass!: string;

  @Column({ name: 'icon_wrap_class', type: 'varchar', length: 255, default: '' })
  iconWrapClass!: string;

  @Column({ name: 'title_hover_class', type: 'varchar', length: 64, default: '' })
  titleHoverClass!: string;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;

  @OneToMany(() => CategoryTranslation, (t) => t.category)
  translations!: CategoryTranslation[];
}
