import { Transform } from 'class-transformer';
import { IsEmail, IsString, Matches } from 'class-validator';

function normalizeOtpCode(value: unknown): string {
  return String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, 6);
}

export class VerifyOtpDto {
  @Transform(({ value }) => String(value ?? '').trim().toLowerCase())
  @IsEmail()
  email!: string;

  @Transform(({ value }) => normalizeOtpCode(value))
  @IsString()
  @Matches(/^\d{6}$/, { message: 'code must be a 6-digit number' })
  code!: string;
}
