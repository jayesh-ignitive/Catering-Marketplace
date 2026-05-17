import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
function trim(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function trimOrNull(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const t = value.trim();
  return t.length ? t : null;
}

export class UpdateHomeBannerDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  title?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  subtitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  @Transform(({ value }: { value: unknown }) => trim(value))
  imageKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  linkHref?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  linkLabel?: string | null;

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
