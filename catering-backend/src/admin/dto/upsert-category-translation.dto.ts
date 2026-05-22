import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

function normalizeString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class UpsertCategoryTranslationDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  languageId!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Transform(({ value }: { value: unknown }) => normalizeString(value))
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) => normalizeString(value))
  shortDescription!: string;
}
