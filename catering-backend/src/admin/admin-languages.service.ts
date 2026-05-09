import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Language } from '../localization/language.entity';
import { CreateLanguageDto } from './dto/create-language.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';

export type AdminLanguageItem = {
  id: string;
  code: string;
  name: string;
  nativeName: string | null;
  direction: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
};

function toItem(row: Language): AdminLanguageItem {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    nativeName: row.nativeName,
    direction: row.direction,
    isDefault: row.isDefault,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
  };
}

@Injectable()
export class AdminLanguagesService {
  constructor(
    @InjectRepository(Language)
    private readonly languages: Repository<Language>,
  ) {}

  async list(): Promise<AdminLanguageItem[]> {
    const rows = await this.languages.find({
      order: { sortOrder: 'ASC', name: 'ASC', createdAt: 'ASC' },
    });
    return rows.map(toItem);
  }

  async create(dto: CreateLanguageDto): Promise<AdminLanguageItem> {
    await this.ensureCodeAvailable(dto.code);
    if (dto.isDefault) {
      await this.languages.update({}, { isDefault: false });
    }
    const row = this.languages.create({
      code: dto.code,
      name: dto.name,
      nativeName: dto.nativeName?.trim() || null,
      direction: dto.direction ?? 'ltr',
      isDefault: dto.isDefault ?? false,
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
    });
    const saved = await this.languages.save(row);
    return toItem(saved);
  }

  async update(id: string, dto: UpdateLanguageDto): Promise<AdminLanguageItem> {
    const row = await this.languages.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('Language not found');
    }
    if (dto.code && dto.code !== row.code) {
      await this.ensureCodeAvailable(dto.code, id);
      row.code = dto.code;
    }
    if (dto.name != null) row.name = dto.name;
    if (dto.nativeName != null) row.nativeName = dto.nativeName.trim() || null;
    if (dto.direction != null) row.direction = dto.direction;
    if (dto.isActive != null) row.isActive = dto.isActive;
    if (dto.sortOrder != null) row.sortOrder = dto.sortOrder;
    if (dto.isDefault != null) {
      if (dto.isDefault) {
        await this.languages.update({}, { isDefault: false });
      }
      row.isDefault = dto.isDefault;
    }
    const saved = await this.languages.save(row);
    return toItem(saved);
  }

  async remove(id: string): Promise<{ success: true }> {
    const row = await this.languages.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('Language not found');
    }
    if (row.isDefault) {
      throw new BadRequestException('Default language cannot be deleted');
    }
    await this.languages.softDelete({ id });
    return { success: true };
  }

  private async ensureCodeAvailable(
    code: string,
    excludeId?: string,
  ): Promise<void> {
    const hit = await this.languages.findOne({
      where: { code },
      withDeleted: true,
    });
    if (hit && hit.id !== excludeId) {
      throw new BadRequestException('Language code already exists');
    }
  }
}
