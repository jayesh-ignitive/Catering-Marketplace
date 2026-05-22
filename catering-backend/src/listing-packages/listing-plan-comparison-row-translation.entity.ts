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
import { ListingPlanComparisonRow } from './listing-plan-comparison-row.entity';

@Entity('listing_plan_comparison_row_translations')
@Unique('UQ_listing_plan_comparison_row_translation', ['row', 'language'])
export class ListingPlanComparisonRowTranslation {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @ManyToOne(() => ListingPlanComparisonRow, (r) => r.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'comparison_row_id' })
  row!: ListingPlanComparisonRow;

  @ManyToOne(() => Language, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'language_id' })
  language!: Language;

  @Column({ type: 'varchar', length: 255 })
  label!: string;

  @Column({ name: 'essential_value', type: 'varchar', length: 120 })
  essentialValue!: string;

  @Column({ name: 'growth_value', type: 'varchar', length: 120 })
  growthValue!: string;

  @Column({ name: 'premier_value', type: 'varchar', length: 120 })
  premierValue!: string;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;
}
