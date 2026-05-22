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
import { LegalPage } from './legal-page.entity';

@Entity('legal_page_translations')
@Unique('UQ_legal_page_translation_page_language', ['legalPage', 'language'])
export class LegalPageTranslation {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @ManyToOne(() => LegalPage, (page) => page.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'legal_page_id' })
  legalPage!: LegalPage;

  @ManyToOne(() => Language, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'language_id' })
  language!: Language;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ name: 'last_updated_label', type: 'varchar', length: 255 })
  lastUpdatedLabel!: string;

  @Column({ name: 'body_html', type: 'longtext' })
  bodyHtml!: string;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;
}
