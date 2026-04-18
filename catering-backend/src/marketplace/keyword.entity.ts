import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Searchable tag for marketplace discovery (many-to-many with caterer profiles). */
@Entity('keywords')
export class Keyword {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** URL-safe unique key, e.g. `north-indian` (lowercase). */
  @Column({ type: 'varchar', length: 80, unique: true })
  slug!: string;

  /** Display label shown in UI. */
  @Column({ type: 'varchar', length: 120 })
  label!: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;
}
