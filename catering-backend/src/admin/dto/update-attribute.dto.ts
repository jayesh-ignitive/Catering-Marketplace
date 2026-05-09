import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { AttributeType } from '../../catalog/attribute-type.enum';

function normalizeImage(value: unknown): unknown {
  if (value === null) return null;
  if (typeof value !== 'string') return value;
  const t = value.trim();
  return t === '' ? null : t;
}

export class UpdateAttributeDto {
  @IsOptional()
  @IsEnum(AttributeType)
  type?: AttributeType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }: { value: unknown }) => normalizeImage(value))
  image?: string | null;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isSearchable?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
