import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { SERVICE_CATEGORY_ICON_KEYS } from '../../marketplace/service-category-presentation.seed';

function trim(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function trimLower(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class CreateServiceCategoryDto {
  @IsString()
  @Length(1, 32)
  @Matches(/^[a-z0-9][a-z0-9_-]*$/i)
  @Transform(({ value }: { value: unknown }) => trimLower(value))
  code!: string;

  @IsString()
  @MaxLength(120)
  @Transform(({ value }: { value: unknown }) => trim(value))
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @Transform(({ value }: { value: unknown }) => trimLower(value))
  slug?: string;

  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) => trim(value))
  shortDescription!: string;

  @IsOptional()
  @IsString()
  @IsIn([...SERVICE_CATEGORY_ICON_KEYS])
  @Transform(({ value }: { value: unknown }) => trimLower(value))
  iconKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    const t = value.trim();
    return t.length ? t : null;
  })
  iconUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Transform(({ value }: { value: unknown }) => trim(value))
  borderClass?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) => trim(value))
  iconWrapClass?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Transform(({ value }: { value: unknown }) => trim(value))
  titleHoverClass?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(9999)
  displayOrder?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
