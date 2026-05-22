import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Language } from '../localization/language.entity';
import { ListingPlan } from './listing-plan.entity';

@Entity('listing_plan_translations')
@Unique('UQ_listing_plan_translation_plan_language', ['plan', 'language'])
export class ListingPlanTranslation {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @ManyToOne(() => ListingPlan, (p) => p.translations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listing_plan_id' })
  plan!: ListingPlan;

  @ManyToOne(() => Language, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'language_id' })
  language!: Language;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  subtitle!: string;

  @Column({ name: 'period_label', type: 'varchar', length: 120 })
  periodLabel!: string;

  @Column({ name: 'cta_label', type: 'varchar', length: 120 })
  ctaLabel!: string;

  @Column({ name: 'features_json', type: 'text' })
  featuresJson!: string;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;
}
