import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { MenuCategory } from './menu-category.entity';
import { MenuItemAttribute } from './menu-item-attribute.entity';
import { MenuItemIngredient } from './menu-item-ingredient.entity';
import { MenuItemTranslation } from './menu-item-translation.entity';

@Entity('menu_items')
export class MenuItem {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @ManyToOne(() => MenuCategory, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category!: MenuCategory;

  @ManyToOne(() => MenuCategory, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'subcategory_id' })
  subcategory!: MenuCategory | null;

  @Column({ name: 'item_code', type: 'varchar', length: 100, unique: true })
  itemCode!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image!: string | null;

  @Column({ type: 'json', nullable: true })
  gallery!: string[] | null;

  @Column({ name: 'video_url', type: 'varchar', length: 500, nullable: true })
  videoUrl!: string | null;

  @Column({ name: 'preparation_time', type: 'int', default: 0 })
  preparationTime!: number;

  @Column({ name: 'cooking_time', type: 'int', default: 0 })
  cookingTime!: number;

  @Column({ name: 'shelf_life_hours', type: 'int', nullable: true })
  shelfLifeHours!: number | null;

  @Column({
    name: 'base_cost',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  baseCost!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  createdBy!: User | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updated_by' })
  updatedBy!: User | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'datetime',
    precision: 6,
    nullable: true,
  })
  deletedAt!: Date | null;

  @OneToMany(() => MenuItemTranslation, (t) => t.menuItem, {
    cascade: false,
  })
  translations!: MenuItemTranslation[];

  @OneToMany(() => MenuItemIngredient, (r) => r.menuItem, {
    cascade: false,
  })
  recipeIngredients!: MenuItemIngredient[];

  @OneToMany(() => MenuItemAttribute, (r) => r.menuItem, {
    cascade: false,
  })
  attributeLinks!: MenuItemAttribute[];
}
