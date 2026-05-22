import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateListingComparisonRowDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsString()
  @MaxLength(255)
  englishLabel!: string;

  @IsString()
  @MaxLength(120)
  englishEssentialValue!: string;

  @IsString()
  @MaxLength(120)
  englishGrowthValue!: string;

  @IsString()
  @MaxLength(120)
  englishPremierValue!: string;
}
