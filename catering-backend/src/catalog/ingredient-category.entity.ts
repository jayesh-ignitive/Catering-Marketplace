import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IngredientCategoryTranslation } from './ingredient-category-translation.entity';

@Entity('ingredient_categories')
export class IngredientCategory {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @ManyToOne(() => IngredientCategory, (cat) => cat.children, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parent_id' })
  parent!: IngredientCategory | null;

  @OneToMany(() => IngredientCategory, (cat) => cat.parent)
  children!: IngredientCategory[];

  @Column({ type: 'varchar', length: 255, unique: true })
  slug!: string;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl!: string | null;

  @Column({ name: 'icon_url', type: 'text', nullable: true })
  iconUrl!: string | null;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder!: number;

  @Column({
    name: 'category_type',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  categoryType!: string | null;

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured!: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;

  @OneToMany(
    () => IngredientCategoryTranslation,
    (translation) => translation.category,
    {
      cascade: false,
    },
  )
  translations!: IngredientCategoryTranslation[];
}
