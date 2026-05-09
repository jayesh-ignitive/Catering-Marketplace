import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { IngredientUnit } from '../../catalog/ingredient-unit.enum';

function normalizeString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeUpperCode(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  return value.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_').replace(/^_|_$/g, '');
}

function normalizeSku(value: unknown): unknown {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') return value;
  const t = value.trim();
  return t === '' ? undefined : t;
}

export class CreateIngredientTranslationDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  languageId!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) => normalizeString(value))
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) => normalizeString(value))
  shortName?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) => normalizeString(value))
  description?: string;
}

export class CreateIngredientDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  ingredientCategoryId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) => normalizeUpperCode(value))
  ingredientCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) => normalizeSku(value))
  sku?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }: { value: unknown }) => normalizeSku(value))
  image?: string;

  @IsOptional()
  @IsEnum(IngredientUnit)
  purchaseUnit?: IngredientUnit;

  @IsOptional()
  @IsEnum(IngredientUnit)
  consumptionUnit?: IngredientUnit;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  @Max(999999.9999)
  conversionFactor?: number;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(99999)
  shelfLifeDays?: number | null;

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
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) => normalizeString(value))
  englishShortName?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) => normalizeString(value))
  englishDescription?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateIngredientTranslationDto)
  translations?: CreateIngredientTranslationDto[];
}
