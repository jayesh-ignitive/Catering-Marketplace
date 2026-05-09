import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { AttributeType } from '../../catalog/attribute-type.enum';

function normalizeString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeImageOptional(value: unknown): unknown {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') return value;
  const t = value.trim();
  return t === '' ? undefined : t;
}

function normalizeAttributeCode(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  return value.trim().toUpperCase();
}

export class CreateAttributeTranslationDto {
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

export class CreateAttributeDto {
  @IsEnum(AttributeType)
  type!: AttributeType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }: { value: unknown }) => normalizeImageOptional(value))
  image?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isSearchable?: boolean;

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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAttributeTranslationDto)
  translations?: CreateAttributeTranslationDto[];
}
