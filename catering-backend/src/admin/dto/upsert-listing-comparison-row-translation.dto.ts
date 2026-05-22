import { IsString, MaxLength } from 'class-validator';

export class UpsertListingComparisonRowTranslationDto {
  @IsString()
  languageId!: string;

  @IsString()
  @MaxLength(255)
  label!: string;

  @IsString()
  @MaxLength(120)
  essentialValue!: string;

  @IsString()
  @MaxLength(120)
  growthValue!: string;

  @IsString()
  @MaxLength(120)
  premierValue!: string;
}
