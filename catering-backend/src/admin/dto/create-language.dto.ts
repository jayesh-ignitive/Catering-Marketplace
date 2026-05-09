import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

function normalizeString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeLowerString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class CreateLanguageDto {
  @IsString()
  @Length(1, 10)
  @Transform(({ value }: { value: unknown }) => normalizeLowerString(value))
  code!: string;

  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) => normalizeString(value))
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) => normalizeString(value))
  nativeName?: string;

  @IsOptional()
  @IsString()
  @IsIn(['ltr', 'rtl'])
  @Transform(({ value }: { value: unknown }) => normalizeLowerString(value))
  direction?: 'ltr' | 'rtl';

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(9999)
  sortOrder?: number;
}
