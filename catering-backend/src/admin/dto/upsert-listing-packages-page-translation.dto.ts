import { IsArray, IsString, MaxLength } from 'class-validator';

export class UpsertListingPackagesPageTranslationDto {
  @IsString()
  languageId!: string;

  @IsString()
  @MaxLength(255)
  heroEyebrow!: string;

  @IsString()
  @MaxLength(255)
  heroTitle!: string;

  @IsString()
  heroSubtitle!: string;

  @IsString()
  @MaxLength(255)
  valueTitle!: string;

  @IsString()
  valueBody!: string;

  @IsString()
  @MaxLength(255)
  discoverTitle!: string;

  @IsString()
  discoverSubtitle!: string;

  @IsString()
  @MaxLength(255)
  comparisonTitle!: string;

  @IsString()
  @MaxLength(255)
  comparisonHint!: string;

  @IsString()
  @MaxLength(120)
  featureColumnLabel!: string;

  @IsString()
  @MaxLength(64)
  tierEssentialLabel!: string;

  @IsString()
  @MaxLength(64)
  tierGrowthLabel!: string;

  @IsString()
  @MaxLength(64)
  tierPremierLabel!: string;

  @IsString()
  @MaxLength(120)
  recommendedBadge!: string;

  @IsString()
  @MaxLength(255)
  audienceTitle!: string;

  @IsString()
  audienceSubtitle!: string;

  @IsArray()
  @IsString({ each: true })
  audienceTags!: string[];

  @IsString()
  @MaxLength(255)
  helpTitle!: string;

  @IsString()
  helpBody!: string;

  @IsString()
  @MaxLength(255)
  browseDirectoryLabel!: string;

  @IsString()
  disclaimerText!: string;
}
