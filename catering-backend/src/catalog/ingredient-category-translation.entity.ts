import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Language } from '../localization/language.entity';
import { IngredientCategory } from './ingredient-category.entity';

@Entity('ingredient_category_translations')
@Unique('UQ_ingredient_category_translation_category_language', [
  'category',
  'language',
])
export class IngredientCategoryTranslation {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @ManyToOne(() => IngredientCategory, (category) => category.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category!: IngredientCategory;

  @ManyToOne(() => Language, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'language_id' })
  language!: Language;

  @Column({ type: 'varchar', length: 255 })
  name!: string;
}
