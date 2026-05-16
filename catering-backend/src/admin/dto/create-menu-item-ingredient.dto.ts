import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { IngredientUnit } from '../../catalog/ingredient-unit.enum';

export class CreateMenuItemIngredientDto {
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
