import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  Validate,
} from 'class-validator';
import { HeroUrlOrDataImageConstraint } from './workspace-profile-hero-url.validator';

/** Same lower bound as catering-website `ABOUT_MIN_LEN` — keep in sync */
export const WORKSPACE_ABOUT_MIN_LEN = 15;

const PRICE_BANDS = ['budget', 'mid', 'premium', 'custom'] as const;

/** Wizard step 0 — business & operational basics (no categories/services/gallery). */
export class WorkspaceProfileStep0Dto {
  @IsString()
  cityId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  streetAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  tagline?: string;

  @IsString()
  @MinLength(WORKSPACE_ABOUT_MIN_LEN)
  @MaxLength(5000)
  about!: string;

  @IsOptional()
  @Validate(HeroUrlOrDataImageConstraint)
  @MaxLength(4 * 1024 * 1024)
  heroImageUrl?: string;

  @IsOptional()
  @IsIn(PRICE_BANDS)
  priceBand?: (typeof PRICE_BANDS)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1000000)
  priceFrom?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  yearsInBusiness?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000000)
  capacityGuestMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000000)
  capacityGuestMax?: number;
}
