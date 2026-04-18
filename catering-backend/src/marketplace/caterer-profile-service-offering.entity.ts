import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { CatererMarketplaceListing } from './caterer-marketplace-listing.entity';
import { ServiceOffering } from './service-offering.entity';

@Entity('caterer_profile_service_offerings')
export class CatererProfileServiceOffering {
  @PrimaryColumn({ name: 'caterer_profile_id', type: 'char', length: 36 })
  catererProfileId!: string;

  @PrimaryColumn({ name: 'service_offering_id', type: 'char', length: 36 })
  serviceOfferingId!: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @ManyToOne(() => CatererMarketplaceListing, (p) => p.profileServiceOfferings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'caterer_profile_id' })
  profile!: CatererMarketplaceListing;

  @ManyToOne(() => ServiceOffering, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_offering_id' })
  serviceOffering!: ServiceOffering;
}
