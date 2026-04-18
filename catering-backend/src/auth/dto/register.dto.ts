import { Transform } from 'class-transformer';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { normalizeDialCode } from './phone-normalize.util';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  businessName!: string;

  /** Dial code: +91, 91, 0091, etc. */
  @Transform(({ value }) => (typeof value === 'string' ? normalizeDialCode(value) : value))
  @IsString()
  @Matches(/^\+\d{1,4}$/, { message: 'Use a valid country code like +1 or +91' })
  phoneCountryCode!: string;

  /** National number; non-digits stripped before validate */
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\D/g, '') : value))
  @IsString()
  @Matches(/^\d{6,14}$/, { message: 'Enter 6–14 digits for the phone number' })
  phoneNumber!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
