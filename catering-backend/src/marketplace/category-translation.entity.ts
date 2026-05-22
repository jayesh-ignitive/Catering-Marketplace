import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Language } from '../localization/language.entity';
import { Category } from './category.entity';

@Entity('category_translations')
@Unique('UQ_category_translation_category_language', ['category', 'language'])
export class CategoryTranslation {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @ManyToOne(() => Category, (category) => category.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  @ManyToOne(() => Language, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'language_id' })
  language!: Language;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ name: 'short_description', type: 'varchar', length: 255 })
  shortDescription!: string;
}
