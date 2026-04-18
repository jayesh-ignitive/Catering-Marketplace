import { IsOptional, IsString, MaxLength } from 'class-validator';

export class KeywordSuggestQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  q?: string;
}
