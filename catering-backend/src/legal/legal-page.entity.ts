import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LegalPageTranslation } from './legal-page-translation.entity';

export type LegalPageSlug = 'terms' | 'privacy';

@Entity('legal_pages')
export class LegalPage {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'varchar', length: 32, unique: true })
  slug!: LegalPageSlug;

  @Column({ name: 'is_published', type: 'boolean', default: true })
  isPublished!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;

  @OneToMany(() => LegalPageTranslation, (t) => t.legalPage)
  translations!: LegalPageTranslation[];
}
