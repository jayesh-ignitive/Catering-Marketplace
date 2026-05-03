export type ImageUploadKind = 'banner' | 'gallery';

/** Contract for saving uploaded images; swap implementation for S3, Cloudflare R2, etc. */
export interface SaveImageInput {
  buffer: Buffer;
  mimeType: string;
  originalFilename?: string;
  kind: ImageUploadKind;
}

export interface SaveImageResult {
  /** Relative path under the public uploads prefix (e.g. images/2026/05/uuid.jpg). */
  key: string;
  /** Absolute URL the browser can load (includes origin). */
  url: string;
}

export interface ImageStoragePort {
  saveImage(input: SaveImageInput): Promise<SaveImageResult>;
}

export const IMAGE_STORAGE = Symbol('IMAGE_STORAGE');
