import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateAccountProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  businessName!: string;
}
