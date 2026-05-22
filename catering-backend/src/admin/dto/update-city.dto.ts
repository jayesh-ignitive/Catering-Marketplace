import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

function trim(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function trimLower(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class UpdateCityDto {
  @IsOptional()
  @IsUUID()
  stateId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @Transform(({ value }: { value: unknown }) => trimLower(value))
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  @Transform(({ value }: { value: unknown }) => {
    if (value === null) return null;
    if (typeof value !== 'string') return value;
    const t = value.trim();
    return t.length ? t : null;
  })
  legacyCatalogId?: string | null;

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
