import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { IngredientUnit } from '../../catalog/ingredient-unit.enum';

export class CreateMenuItemTranslationDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  languageId!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateMenuItemIngredientLineDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  ingredientId!: number;

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsOptional()
  @IsEnum(IngredientUnit)
  unit?: IngredientUnit;

  @IsOptional()
  @IsBoolean()
  isOptional?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class CreateMenuItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  subcategoryId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  itemCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  image?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  gallery?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  videoUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  preparationTime?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  cookingTime?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  shelfLifeHours?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  baseCost?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  englishName!: string;

  @IsOptional()
  @IsString()
  englishDescription?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMenuItemTranslationDto)
  translations?: CreateMenuItemTranslationDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMenuItemIngredientLineDto)
  ingredients?: CreateMenuItemIngredientLineDto[];

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  attributeIds?: number[];
}
