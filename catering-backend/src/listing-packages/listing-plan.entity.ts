import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ListingPlanTranslation } from './listing-plan-translation.entity';

export type ListingPlanCode = 'essential' | 'growth' | 'premier';

@Entity('listing_plans')
export class ListingPlan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 32, unique: true })
  code!: ListingPlanCode;

  @Column({ name: 'price_display', type: 'varchar', length: 64 })
  priceDisplay!: string;

  @Column({ type: 'varchar', length: 32, default: 'medal' })
  icon!: string;

  @Column({ name: 'is_recommended', type: 'boolean', default: false })
  isRecommended!: boolean;

  @Column({ name: 'is_dark_theme', type: 'boolean', default: false })
  isDarkTheme!: boolean;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'contact_topic', type: 'varchar', length: 120 })
  contactTopic!: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;

  @OneToMany(() => ListingPlanTranslation, (t) => t.plan)
  translations!: ListingPlanTranslation[];
}
