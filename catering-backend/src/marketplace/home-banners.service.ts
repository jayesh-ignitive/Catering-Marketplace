import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImagePublicUrlService } from '../storage/image-public-url.service';
import { HomeBanner, type HomeBannerPlacement } from './home-banner.entity';

export type PublicHomeBanner = {
  id: string;
  placement: HomeBannerPlacement;
  title: string | null;
  subtitle: string | null;
  imageUrl: string;
  linkHref: string | null;
  linkLabel: string | null;
  displayOrder: number;
};

function toPublic(row: HomeBanner, imageUrls: ImagePublicUrlService): PublicHomeBanner {
  const imageUrl = imageUrls.resolveToPublicUrl(row.imageKey);
  if (!imageUrl) {
    throw new Error(`Home banner ${row.id} has invalid image_key`);
  }
  return {
    id: row.id,
    placement: row.placement,
    title: row.title,
    subtitle: row.subtitle,
    imageUrl,
    linkHref: row.linkHref,
    linkLabel: row.linkLabel,
    displayOrder: row.displayOrder,
  };
}

@Injectable()
export class HomeBannersService {
  private readonly log = new Logger(HomeBannersService.name);
  private cachedPublic: PublicHomeBanner[] | null = null;

  constructor(
    @InjectRepository(HomeBanner)
    private readonly banners: Repository<HomeBanner>,
    private readonly imageUrls: ImagePublicUrlService,
  ) {}

  invalidateCache(): void {
    this.cachedPublic = null;
    this.log.debug('Home banners cache cleared');
  }

  async listPublicActive(): Promise<PublicHomeBanner[]> {
    if (this.cachedPublic != null && this.cachedPublic.length > 0) {
      return this.cachedPublic;
    }
    const rows = await this.banners.find({
      where: { isActive: true },
      order: { placement: 'ASC', displayOrder: 'ASC', createdAt: 'ASC' },
    });
    const mapped = rows.map((r) => toPublic(r, this.imageUrls));
    // Do not cache empty lists — avoids stale [] after first deploy or seed migrations.
    this.cachedPublic = mapped.length > 0 ? mapped : null;
    return mapped;
  }

  async listByPlacement(placement: HomeBannerPlacement): Promise<PublicHomeBanner[]> {
    const all = await this.listPublicActive();
    return all.filter((b) => b.placement === placement);
  }

  async listAll(): Promise<HomeBanner[]> {
    return this.banners.find({
      order: { placement: 'ASC', displayOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async findById(id: string): Promise<HomeBanner | null> {
    return this.banners.findOne({ where: { id } });
  }

  async save(row: HomeBanner): Promise<HomeBanner> {
    const saved = await this.banners.save(row);
    this.invalidateCache();
    return saved;
  }

  async remove(row: HomeBanner): Promise<void> {
    await this.banners.remove(row);
    this.invalidateCache();
  }

  normalizeImageKey(incoming: string): string {
    const key = this.imageUrls.stripToStorageKey(incoming);
    if (!key) {
      throw new Error('imageKey is required');
    }
    return key;
  }
}
