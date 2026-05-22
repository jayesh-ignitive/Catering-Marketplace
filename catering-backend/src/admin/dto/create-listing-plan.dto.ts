import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateListingPlanDto {
  @IsString()
  @IsIn(['essential', 'growth', 'premier'])
  code!: 'essential' | 'growth' | 'premier';

  @IsString()
  @MaxLength(64)
  priceDisplay!: string;

  @IsString()
  @MaxLength(32)
  icon!: string;

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

  @IsString()
  @MaxLength(120)
  contactTopic!: string;

  @IsString()
  @MaxLength(120)
  englishName!: string;

  @IsString()
  @MaxLength(255)
  englishSubtitle!: string;

  @IsString()
  @MaxLength(120)
  englishPeriodLabel!: string;

  @IsString()
  @MaxLength(120)
  englishCtaLabel!: string;

  @IsArray()
  @IsString({ each: true })
  englishFeatures!: string[];
}
