import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateLegalPageDto {
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
