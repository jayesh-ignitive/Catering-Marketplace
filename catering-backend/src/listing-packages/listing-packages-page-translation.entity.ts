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

@Entity('listing_packages_page_translations')
@Unique('UQ_listing_packages_page_translation_language', ['language'])
export class ListingPackagesPageTranslation {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @ManyToOne(() => Language, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'language_id' })
  language!: Language;

  @Column({ name: 'hero_eyebrow', type: 'varchar', length: 255 })
  heroEyebrow!: string;

  @Column({ name: 'hero_title', type: 'varchar', length: 255 })
  heroTitle!: string;

  @Column({ name: 'hero_subtitle', type: 'text' })
  heroSubtitle!: string;

  @Column({ name: 'value_title', type: 'varchar', length: 255 })
  valueTitle!: string;

  @Column({ name: 'value_body', type: 'text' })
  valueBody!: string;

  @Column({ name: 'discover_title', type: 'varchar', length: 255 })
  discoverTitle!: string;

  @Column({ name: 'discover_subtitle', type: 'text' })
  discoverSubtitle!: string;

  @Column({ name: 'comparison_title', type: 'varchar', length: 255 })
  comparisonTitle!: string;

  @Column({ name: 'comparison_hint', type: 'varchar', length: 255 })
  comparisonHint!: string;

  @Column({ name: 'feature_column_label', type: 'varchar', length: 120 })
  featureColumnLabel!: string;

  @Column({ name: 'tier_essential_label', type: 'varchar', length: 64 })
  tierEssentialLabel!: string;

  @Column({ name: 'tier_growth_label', type: 'varchar', length: 64 })
  tierGrowthLabel!: string;

  @Column({ name: 'tier_premier_label', type: 'varchar', length: 64 })
  tierPremierLabel!: string;

  @Column({ name: 'recommended_badge', type: 'varchar', length: 120 })
  recommendedBadge!: string;

  @Column({ name: 'audience_title', type: 'varchar', length: 255 })
  audienceTitle!: string;

  @Column({ name: 'audience_subtitle', type: 'text' })
  audienceSubtitle!: string;

  @Column({ name: 'audience_tags_json', type: 'text' })
  audienceTagsJson!: string;

  @Column({ name: 'help_title', type: 'varchar', length: 255 })
  helpTitle!: string;

  @Column({ name: 'help_body', type: 'text' })
  helpBody!: string;

  @Column({ name: 'browse_directory_label', type: 'varchar', length: 255 })
  browseDirectoryLabel!: string;

  @Column({ name: 'disclaimer_text', type: 'text' })
  disclaimerText!: string;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;
}
