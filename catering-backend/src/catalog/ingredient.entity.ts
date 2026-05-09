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
import { IngredientCategory } from './ingredient-category.entity';
import { IngredientTranslation } from './ingredient-translation.entity';
import { IngredientUnit } from './ingredient-unit.enum';

@Entity('ingredients')
export class Ingredient {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @ManyToOne(() => IngredientCategory, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'ingredient_category_id' })
  ingredientCategory!: IngredientCategory | null;

  @Column({ name: 'ingredient_code', type: 'varchar', length: 100, unique: true })
  ingredientCode!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sku!: string | null;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image!: string | null;

  @Column({
    name: 'purchase_unit',
    type: 'enum',
    enum: IngredientUnit,
    default: IngredientUnit.KG,
  })
  purchaseUnit!: IngredientUnit;

  @Column({
    name: 'consumption_unit',
    type: 'enum',
    enum: IngredientUnit,
    default: IngredientUnit.GM,
  })
  consumptionUnit!: IngredientUnit;

  @Column({
    name: 'conversion_factor',
    type: 'decimal',
    precision: 10,
    scale: 4,
    default: 1,
  })
  conversionFactor!: string;

  @Column({ name: 'shelf_life_days', type: 'int', nullable: true })
  shelfLifeDays!: number | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

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

  @OneToMany(() => IngredientTranslation, (t) => t.ingredient, {
    cascade: false,
  })
  translations!: IngredientTranslation[];
}
