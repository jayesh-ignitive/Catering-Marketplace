import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { CatererMarketplaceListing } from './caterer-marketplace-listing.entity';
import { Cuisine } from './cuisine.entity';

@Entity('caterer_profile_cuisines')
export class CatererProfileCuisine {
  @PrimaryColumn({ name: 'caterer_profile_id', type: 'char', length: 36 })
  catererProfileId!: string;

  @PrimaryColumn({ name: 'cuisine_id', type: 'char', length: 36 })
  cuisineId!: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @ManyToOne(() => CatererMarketplaceListing, (p) => p.profileCuisines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'caterer_profile_id' })
  profile!: CatererMarketplaceListing;

  @ManyToOne(() => Cuisine, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cuisine_id' })
  cuisine!: Cuisine;
}
