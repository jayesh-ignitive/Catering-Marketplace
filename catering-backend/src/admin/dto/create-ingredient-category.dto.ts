import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

function normalizeString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeLowerString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class CreateIngredientCategoryTranslationDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  languageId!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) => normalizeString(value))
  name!: string;
}

export class CreateIngredientCategoryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  parentId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) => normalizeLowerString(value))
  slug?: string;

  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false }, { message: 'imageUrl must be a valid URL' })
  imageUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(9999)
  displayOrder?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }: { value: unknown }) => normalizeString(value))
  categoryType?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) => normalizeString(value))
  englishName!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateIngredientCategoryTranslationDto)
  translations?: CreateIngredientCategoryTranslationDto[];
}
