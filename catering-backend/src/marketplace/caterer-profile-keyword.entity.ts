import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { CatererMarketplaceListing } from './caterer-marketplace-listing.entity';
import { Keyword } from './keyword.entity';

@Entity('caterer_profile_keywords')
export class CatererProfileKeyword {
  @PrimaryColumn({ name: 'caterer_profile_id', type: 'char', length: 36 })
  catererProfileId!: string;

  @PrimaryColumn({ name: 'keyword_id', type: 'char', length: 36 })
  keywordId!: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @ManyToOne(() => CatererMarketplaceListing, (p) => p.profileKeywords, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'caterer_profile_id' })
  profile!: CatererMarketplaceListing;

  @ManyToOne(() => Keyword, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'keyword_id' })
  keyword!: Keyword;
}
