import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCatererReviewDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  authorName!: string;

  @IsEmail()
  @MaxLength(255)
  authorEmail!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(32)
  authorPhone!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  comment!: string;
}
