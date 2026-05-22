import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CityTranslation } from './city-translation.entity';
import { State } from './state.entity';

@Entity('cities')
export class City {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => State, (s) => s.cities, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'state_id' })
  state!: State;

  /** English display name (synced with en translation). */
  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 120, unique: true })
  slug!: string;

  /** Legacy catalog hero filter id (`1`–`10`) when applicable. */
  @Column({ name: 'legacy_catalog_id', type: 'varchar', length: 10, nullable: true, unique: true })
  legacyCatalogId!: string | null;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;

  @OneToMany(() => CityTranslation, (t) => t.city)
  translations!: CityTranslation[];
}
