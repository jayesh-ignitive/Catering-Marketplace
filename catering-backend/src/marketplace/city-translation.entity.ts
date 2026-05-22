import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Language } from '../localization/language.entity';
import { City } from './city.entity';

@Entity('city_translations')
@Unique('UQ_city_translation_city_language', ['city', 'language'])
export class CityTranslation {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @ManyToOne(() => City, (city) => city.translations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'city_id' })
  city!: City;

  @ManyToOne(() => Language, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'language_id' })
  language!: Language;

  @Column({ type: 'varchar', length: 120 })
  name!: string;
}
