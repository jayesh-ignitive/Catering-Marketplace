import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tenant } from '../tenant/tenant.entity';
import { CatererProfileCategory } from './caterer-profile-category.entity';
import { CatererProfileCuisine } from './caterer-profile-cuisine.entity';
import { CatererProfileGalleryImage } from './caterer-profile-gallery-image.entity';
import { CatererProfileKeyword } from './caterer-profile-keyword.entity';
import { CatererProfileServiceOffering } from './caterer-profile-service-offering.entity';
import { City } from './city.entity';

export type CatererPriceBand = 'budget' | 'mid' | 'premium' | 'custom';

@Entity('caterer_profiles')
export class CatererMarketplaceListing {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'char', length: 36, unique: true })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @ManyToOne(() => City, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'city_id' })
  cityRef!: City | null;

  @Column({ name: 'street_address', type: 'varchar', length: 300, nullable: true })
  streetAddress!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude!: string | null;

  @Column({ type: 'decimal', precision: 11, scale: 7, nullable: true })
  longitude!: string | null;

  @OneToMany(() => CatererProfileCategory, (c) => c.profile, { cascade: false })
  profileCategories!: CatererProfileCategory[];

  @OneToMany(() => CatererProfileGalleryImage, (g) => g.profile, { cascade: false })
  galleryItems!: CatererProfileGalleryImage[];

  @OneToMany(() => CatererProfileCuisine, (c) => c.profile, { cascade: false })
  profileCuisines!: CatererProfileCuisine[];

  @OneToMany(() => CatererProfileServiceOffering, (s) => s.profile, { cascade: false })
  profileServiceOfferings!: CatererProfileServiceOffering[];

  @OneToMany(() => CatererProfileKeyword, (k) => k.profile, { cascade: false })
  profileKeywords!: CatererProfileKeyword[];

  @Column({ name: 'price_band', type: 'varchar', length: 16, nullable: true })
  priceBand!: CatererPriceBand | null;

  @Column({ type: 'varchar', length: 220, nullable: true })
  tagline!: string | null;

  @Column({ type: 'text', nullable: true })
  about!: string | null;

  /** Relative key e.g. `images/banner/uuid.jpg`, or legacy full URL / `data:image/…`. */
  @Column({ name: 'hero_image_url', type: 'longtext', nullable: true })
  heroImageUrl!: string | null;

  @Column({ name: 'years_in_business', type: 'smallint', unsigned: true, nullable: true })
  yearsInBusiness!: number | null;

  /** Minimum typical guest count (inclusive). */
  @Column({ name: 'capacity_guest_min', type: 'int', unsigned: true, nullable: true })
  capacityGuestMin!: number | null;

  /** Maximum typical guest count (inclusive). */
  @Column({ name: 'capacity_guest_max', type: 'int', unsigned: true, nullable: true })
  capacityGuestMax!: number | null;

  @Column({ name: 'avg_rating', type: 'decimal', precision: 2, scale: 1, default: 0 })
  avgRating!: string;

  @Column({ name: 'review_count', type: 'int', unsigned: true, default: 0 })
  reviewCount!: number;

  /** Indicative minimum price per guest (INR); display with `Intl` on clients. */
  @Column({ name: 'price_from', type: 'decimal', precision: 12, scale: 2, nullable: true })
  priceFrom!: string | null;

  @Column({ type: 'boolean', default: false })
  published!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;
}
