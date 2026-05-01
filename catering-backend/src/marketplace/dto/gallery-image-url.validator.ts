import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

/**
 * Gallery entries may be hosted URLs or browser uploads (`data:image/…`), mirroring hero handling.
 */
@ValidatorConstraint({ name: 'galleryImageUrlOrData', async: false })
export class GalleryImageUrlOrDataConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, _args: ValidationArguments): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value !== 'string') return false;
    const v = value.trim();
    if (v.length === 0) return false;
    if (v.startsWith('data:image/')) {
      return v.length <= 3 * 1024 * 1024;
    }
    try {
      const u = new URL(v);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  }

  defaultMessage(): string {
    return 'each gallery image must be a valid http(s) URL or a data:image string';
  }
}
