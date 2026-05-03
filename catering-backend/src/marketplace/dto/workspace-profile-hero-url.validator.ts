import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

/**
 * Align with catering-website workspace wizard: https URLs or browser banner uploads (`data:image/…`).
 * Keep rules consistent with client-side banner handling.
 */
@ValidatorConstraint({ name: 'heroUrlOrDataImage', async: false })
export class HeroUrlOrDataImageConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, _args: ValidationArguments): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value !== 'string') return false;
    const v = value.trim();
    if (v.length === 0) return true;
    if (v.startsWith('data:image/')) {
      return v.length <= 3 * 1024 * 1024;
    }
    if (v.startsWith('images/banner/')) {
      return v.length <= 2048 && !/\s/.test(v) && /\.(jpe?g|png|webp|gif)$/i.test(v);
    }
    /** Legacy keys (date folders) or any relative `images/…` path stored in DB */
    if (v.startsWith('images/')) {
      return v.length <= 2048 && !/\s/.test(v);
    }
    try {
      const u = new URL(v);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  }

  defaultMessage(): string {
    return 'heroImageUrl must be a storage key under images/banner/, a valid http(s) URL, or a data:image banner';
  }
}
