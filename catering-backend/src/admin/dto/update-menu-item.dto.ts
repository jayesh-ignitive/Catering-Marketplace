import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateMenuItemIngredientLineDto } from './create-menu-item.dto';

export class UpdateMenuItemDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  subcategoryId?: number | null;

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
  image?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  gallery?: string[] | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  videoUrl?: string | null;

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

  /** When present, replaces all attribute links with this set (may be empty). */
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  attributeIds?: number[];

  /** When present, replaces all recipe lines (may be empty). */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMenuItemIngredientLineDto)
  ingredients?: CreateMenuItemIngredientLineDto[];
}
