import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { CatererMarketplaceListing } from './caterer-marketplace-listing.entity';

@Entity('caterer_profile_gallery_images')
export class CatererProfileGalleryImage {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'caterer_profile_id', type: 'char', length: 36 })
  catererProfileId!: string;

  @ManyToOne(() => CatererMarketplaceListing, (p) => p.galleryItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'caterer_profile_id' })
  profile!: CatererMarketplaceListing;

  /** Hosted URLs or inline `data:image/…` from workspace uploads (can exceed 512 chars). */
  @Column({ type: 'longtext' })
  url!: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;
}
