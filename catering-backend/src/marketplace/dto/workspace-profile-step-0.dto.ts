import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  Validate,
  ValidateIf,
} from 'class-validator';
import { HeroUrlOrDataImageConstraint } from './workspace-profile-hero-url.validator';

/** Same lower bound as catering-website `ABOUT_MIN_LEN` — keep in sync */
export const WORKSPACE_ABOUT_MIN_LEN = 15;

const PRICE_BANDS = ['budget', 'mid', 'premium', 'custom'] as const;

/** Wizard step 0 — business & operational basics (no categories/services/gallery). */
export class WorkspaceProfileStep0Dto {
  @IsOptional()
  @IsString()
  cityId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  cityName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  streetAddress?: string;

  @IsOptional()
  @IsString()
  @ValidateIf((_o, v) => v != null && v !== '')
  @Matches(/^\d{6}$/, { message: 'pincode must be a 6-digit number' })
  pincode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  country?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

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
  @Max(1000000)
  priceTo?: number | null;

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
