import { Entity, JoinColumn, ManyToOne, PrimaryColumn, Column } from 'typeorm';
import { CatererMarketplaceListing } from './caterer-marketplace-listing.entity';
import { Category } from './category.entity';

/** Many-to-many: caterer profile ↔ categories (ordered; lowest `sort_order` is primary for listings). */
@Entity('caterer_profile_categories')
export class CatererProfileCategory {
  @PrimaryColumn({ name: 'caterer_profile_id', type: 'char', length: 36 })
  catererProfileId!: string;

  @PrimaryColumn({ name: 'category_id', type: 'char', length: 36 })
  categoryId!: string;

  @Column({ name: 'sort_order', type: 'smallint', default: 0 })
  sortOrder!: number;

  @ManyToOne(() => CatererMarketplaceListing, (p) => p.profileCategories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'caterer_profile_id' })
  profile!: CatererMarketplaceListing;

  @ManyToOne(() => Category, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category!: Category;
}
