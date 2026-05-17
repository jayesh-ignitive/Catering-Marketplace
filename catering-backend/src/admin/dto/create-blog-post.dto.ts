import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

function trim(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function trimLower(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

function trimOrNull(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const t = value.trim();
  return t.length ? t : null;
}

export class CreateBlogPostDto {
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) => trim(value))
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @Transform(({ value }: { value: unknown }) => trimLower(value))
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(70)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  metaTitle?: string | null;

  @IsString()
  @MaxLength(500)
  @Transform(({ value }: { value: unknown }) => trim(value))
  excerpt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  metaDescription?: string | null;

  @IsString()
  @MinLength(1)
  @Transform(({ value }: { value: unknown }) => trim(value))
  bodyHtml!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Transform(({ value }: { value: unknown }) => trim(value))
  categoryLabel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  featuredImageUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  @Transform(({ value }: { value: unknown }) => trimOrNull(value))
  ogImageUrl?: string | null;

  @IsDateString()
  publishedAt!: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPublished?: boolean;
}
