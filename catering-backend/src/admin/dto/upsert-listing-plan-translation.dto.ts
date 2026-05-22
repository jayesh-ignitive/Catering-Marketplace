import { IsArray, IsString, MaxLength } from 'class-validator';

export class UpsertListingPlanTranslationDto {
  @IsString()
  languageId!: string;

  @IsString()
  @MaxLength(120)
  name!: string;

  @IsString()
  @MaxLength(255)
  subtitle!: string;

  @IsString()
  @MaxLength(120)
  periodLabel!: string;

  @IsString()
  @MaxLength(120)
  ctaLabel!: string;

  @IsArray()
  @IsString({ each: true })
  features!: string[];
}
