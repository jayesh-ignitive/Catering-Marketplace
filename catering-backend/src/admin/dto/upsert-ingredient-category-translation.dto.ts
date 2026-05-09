import { Transform, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

function normalizeString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class UpsertIngredientCategoryTranslationDto {
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
