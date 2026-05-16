import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { IngredientUnit } from './ingredient-unit.enum';
import { Ingredient } from './ingredient.entity';
import { MenuItem } from './menu-item.entity';

@Entity('menu_item_ingredients')
@Unique('UQ_menu_item_ingredient_pair', ['menuItem', 'ingredient'])
export class MenuItemIngredient {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @ManyToOne(() => MenuItem, (item) => item.recipeIngredients, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'menu_item_id' })
  menuItem!: MenuItem;

  @ManyToOne(() => Ingredient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ingredient_id' })
  ingredient!: Ingredient;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantity!: string;

  @Column({
    type: 'enum',
    enum: IngredientUnit,
    default: IngredientUnit.GM,
  })
  unit!: IngredientUnit;

  @Column({ name: 'is_optional', type: 'boolean', default: false })
  isOptional!: boolean;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;
}
