import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Language } from '../localization/language.entity';
import { Ingredient } from './ingredient.entity';

@Entity('ingredient_translations')
@Unique('UQ_ingredient_translation_ingredient_language', ['ingredient', 'language'])
export class IngredientTranslation {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @ManyToOne(() => Ingredient, (ingredient) => ingredient.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ingredient_id' })
  ingredient!: Ingredient;

  @ManyToOne(() => Language, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'language_id' })
  language!: Language;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'short_name', type: 'varchar', length: 100, nullable: true })
  shortName!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

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
}
