import { Transform } from 'class-transformer';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  Validate,
} from 'class-validator';
import { GalleryImageUrlOrDataConstraint } from './gallery-image-url.validator';
import { HeroUrlOrDataImageConstraint } from './workspace-profile-hero-url.validator';
import { WORKSPACE_ABOUT_MIN_LEN } from './workspace-profile-step-0.dto';

const PRICE_BANDS = ['budget', 'mid', 'premium', 'custom'] as const;

/** Full profile replace (non–step-by-step). Prefer PATCH …/profile/step/:n from the wizard. */
export class UpsertCatererWorkspaceProfileDto {
  @IsString()
  cityId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  streetAddress?: string;

  @IsOptional()
  @IsString()
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
  @IsString()
  @MaxLength(500)
  formattedAddress?: string;

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

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'heroImageUrl is required' })
  @Validate(HeroUrlOrDataImageConstraint)
  @MaxLength(4 * 1024 * 1024)
  heroImageUrl!: string;

  @IsOptional()
  @IsIn(PRICE_BANDS)
  priceBand?: (typeof PRICE_BANDS)[number];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000000)
  priceFrom?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000000)
  priceTo?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  yearsInBusiness?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000000)
  capacityGuestMin?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000000)
  capacityGuestMax?: number;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  categoryCodes!: string[];

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  serviceOfferingIds!: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  keywords?: string[];

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @Validate(GalleryImageUrlOrDataConstraint, { each: true })
  @MaxLength(4 * 1024 * 1024, { each: true })
  galleryImageUrls!: string[];
}
