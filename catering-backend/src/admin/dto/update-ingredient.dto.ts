import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { IngredientUnit } from '../../catalog/ingredient-unit.enum';

function normalizeUpperCode(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  return value.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_').replace(/^_|_$/g, '');
}

function normalizeNullableSku(value: unknown): unknown {
  if (value === null) return null;
  if (typeof value !== 'string') return value;
  const t = value.trim();
  return t === '' ? null : t;
}

export class UpdateIngredientDto {
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  ingredientCategoryId?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) => normalizeUpperCode(value))
  ingredientCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) => normalizeNullableSku(value))
  sku?: string | null;

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
  @Transform(({ value }: { value: unknown }) => normalizeNullableSku(value))
  image?: string | null;

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
}
