import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

function normalizeString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class UpsertLegalPageTranslationDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  languageId!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) => normalizeString(value))
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) => normalizeString(value))
  lastUpdatedLabel!: string;

  @IsString()
  @MinLength(1)
  @Transform(({ value }: { value: unknown }) => normalizeString(value))
  bodyHtml!: string;
}
