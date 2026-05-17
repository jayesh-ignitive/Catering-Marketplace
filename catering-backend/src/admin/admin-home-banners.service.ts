import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HomeBanner } from '../marketplace/home-banner.entity';
import { HomeBannersService } from '../marketplace/home-banners.service';
import { ImagePublicUrlService } from '../storage/image-public-url.service';
import { CreateHomeBannerDto } from './dto/create-home-banner.dto';
import { UpdateHomeBannerDto } from './dto/update-home-banner.dto';

export type AdminHomeBannerItem = {
  id: string;
  placement: HomeBanner['placement'];
  title: string | null;
  subtitle: string | null;
  imageKey: string;
  imageUrl: string;
  linkHref: string | null;
  linkLabel: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

function toAdminItem(row: HomeBanner, imageUrls: ImagePublicUrlService): AdminHomeBannerItem {
  const imageUrl = imageUrls.resolveToPublicUrl(row.imageKey) ?? row.imageKey;
  return {
    id: row.id,
    placement: row.placement,
    title: row.title,
    subtitle: row.subtitle,
    imageKey: row.imageKey,
    imageUrl,
    linkHref: row.linkHref,
    linkLabel: row.linkLabel,
    displayOrder: row.displayOrder,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class AdminHomeBannersService {
  constructor(
    @InjectRepository(HomeBanner)
    private readonly banners: Repository<HomeBanner>,
    private readonly homeBanners: HomeBannersService,
    private readonly imageUrls: ImagePublicUrlService,
  ) {}

  async list(): Promise<AdminHomeBannerItem[]> {
    const rows = await this.homeBanners.listAll();
    return rows
      .filter((r) => r.placement === 'hero')
      .map((r) => toAdminItem(r, this.imageUrls));
  }

  async create(dto: CreateHomeBannerDto): Promise<AdminHomeBannerItem> {
    const row = this.banners.create({
      placement: 'hero',
      title: dto.title ?? null,
      subtitle: dto.subtitle ?? null,
      imageKey: this.homeBanners.normalizeImageKey(dto.imageKey),
      linkHref: dto.linkHref ?? null,
      linkLabel: dto.linkLabel ?? null,
      displayOrder: dto.displayOrder ?? 0,
      isActive: dto.isActive ?? true,
    });
    const saved = await this.homeBanners.save(row);
    return toAdminItem(saved, this.imageUrls);
  }

  async update(id: string, dto: UpdateHomeBannerDto): Promise<AdminHomeBannerItem> {
    const row = await this.banners.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('Home banner not found');
    }
    if (dto.title !== undefined) row.title = dto.title ?? null;
    if (dto.subtitle !== undefined) row.subtitle = dto.subtitle ?? null;
    if (dto.imageKey != null) {
      row.imageKey = this.homeBanners.normalizeImageKey(dto.imageKey);
    }
    if (dto.linkHref !== undefined) row.linkHref = dto.linkHref ?? null;
    if (dto.linkLabel !== undefined) row.linkLabel = dto.linkLabel ?? null;
    if (dto.displayOrder != null) row.displayOrder = dto.displayOrder;
    if (dto.isActive != null) row.isActive = dto.isActive;

    const saved = await this.homeBanners.save(row);
    return toAdminItem(saved, this.imageUrls);
  }

  async remove(id: string): Promise<{ success: true }> {
    const row = await this.banners.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('Home banner not found');
    }
    await this.homeBanners.remove(row);
    return { success: true };
  }
}
