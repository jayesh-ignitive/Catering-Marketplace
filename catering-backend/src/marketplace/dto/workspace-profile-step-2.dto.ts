import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  Validate,
} from 'class-validator';
import { GalleryImageUrlOrDataConstraint } from './gallery-image-url.validator';
import { HeroUrlOrDataImageConstraint } from './workspace-profile-hero-url.validator';

/** Wizard step 2 — gallery (hosted URLs or `data:image/` uploads) + optional banner. */
export class WorkspaceProfileStep2Dto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @Validate(GalleryImageUrlOrDataConstraint, { each: true })
  @MaxLength(4 * 1024 * 1024, { each: true })
  galleryImageUrls!: string[];

  @IsOptional()
  @Validate(HeroUrlOrDataImageConstraint)
  @MaxLength(4 * 1024 * 1024)
  heroImageUrl?: string;
}
