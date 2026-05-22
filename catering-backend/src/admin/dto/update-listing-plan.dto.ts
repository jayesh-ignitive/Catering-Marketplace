import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateListingPlanDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  priceDisplay?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  icon?: string;

  @IsOptional()
  @IsBoolean()
  isRecommended?: boolean;

  @IsOptional()
  @IsBoolean()
  isDarkTheme?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactTopic?: string;
}
