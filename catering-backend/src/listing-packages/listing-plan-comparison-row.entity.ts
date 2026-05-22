import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ListingPlanComparisonRowTranslation } from './listing-plan-comparison-row-translation.entity';

@Entity('listing_plan_comparison_rows')
export class ListingPlanComparisonRow {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;

  @OneToMany(() => ListingPlanComparisonRowTranslation, (t) => t.row)
  translations!: ListingPlanComparisonRowTranslation[];
}
