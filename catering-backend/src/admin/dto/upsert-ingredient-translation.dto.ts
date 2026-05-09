import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

function normalizeString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class UpsertIngredientTranslationDto {
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
