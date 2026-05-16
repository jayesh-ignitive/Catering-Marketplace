import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';

export type PublicServiceCategory = {
  /** Legacy filter id — stable `code` (e.g. `c1`). */
  id: string;
  code: string;
  uuid: string;
  name: string;
  slug: string;
  shortDescription: string;
  iconKey: string;
  /** Uploaded icon asset URL (stored in `image_url` column). */
  iconUrl: string | null;
  borderClass: string;
  iconWrapClass: string;
  titleHoverClass: string;
  displayOrder: number;
};

function toPublic(row: Category): PublicServiceCategory {
  return {
    id: row.code,
    code: row.code,
    uuid: row.id,
    name: row.name,
    slug: row.slug,
    shortDescription: row.shortDescription,
    iconKey: row.iconKey,
    iconUrl: row.imageUrl,
    borderClass: row.borderClass,
    iconWrapClass: row.iconWrapClass,
    titleHoverClass: row.titleHoverClass,
    displayOrder: row.displayOrder,
  };
}

@Injectable()
export class ServiceCategoriesService {
  private readonly log = new Logger(ServiceCategoriesService.name);
  private cachedPublic: PublicServiceCategory[] | null = null;

  constructor(
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
  ) {}

  /** In-memory cache for public catalog reads; cleared on admin writes. */
  invalidateCache(): void {
    this.cachedPublic = null;
    this.log.debug('Service categories cache cleared');
  }

  async listPublicActive(): Promise<PublicServiceCategory[]> {
    if (this.cachedPublic) {
      return this.cachedPublic;
    }
    const rows = await this.categories.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC', code: 'ASC' },
    });
    this.cachedPublic = rows.map(toPublic);
    return this.cachedPublic;
  }

  async listAll(): Promise<Category[]> {
    return this.categories.find({
      order: { displayOrder: 'ASC', code: 'ASC' },
    });
  }

  async findByUuid(id: string): Promise<Category | null> {
    return this.categories.findOne({ where: { id } });
  }

  async findByCode(code: string): Promise<Category | null> {
    return this.categories.findOne({ where: { code } });
  }

  async save(row: Category): Promise<Category> {
    const saved = await this.categories.save(row);
    this.invalidateCache();
    return saved;
  }

  async remove(row: Category): Promise<void> {
    await this.categories.remove(row);
    this.invalidateCache();
  }
}
