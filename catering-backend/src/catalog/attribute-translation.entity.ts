import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Language } from '../localization/language.entity';
import { Attribute } from './attribute.entity';

@Entity('attribute_translations')
@Unique('UQ_attribute_translation_attribute_language', ['attribute', 'language'])
export class AttributeTranslation {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @ManyToOne(() => Attribute, (attribute) => attribute.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'attribute_id' })
  attribute!: Attribute;

  @ManyToOne(() => Language, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'language_id' })
  language!: Language;

  @Column({ type: 'varchar', length: 255 })
  name!: string;
}
