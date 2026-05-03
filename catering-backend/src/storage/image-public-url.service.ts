import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * DB stores relative object keys (e.g. `images/banner/uuid.jpg`) or legacy full URLs / `data:`.
 * API responses prepend the configured public base (R2 or local `/uploads`).
 */
@Injectable()
export class ImagePublicUrlService {
  constructor(private readonly config: ConfigService) {}

  private uploadPublicBase(): string {
    return (this.config.get<string>('UPLOAD_PUBLIC_BASE_URL')?.trim() || 'http://localhost:4000').replace(
      /\/$/,
      '',
    );
  }

  private uploadsBase(): string {
    return `${this.uploadPublicBase()}/uploads`;
  }

  private r2PublicBase(): string {
    return (this.config.get<string>('S3_PUBLIC_BASE_URL')?.trim() || '').replace(/\/$/, '');
  }

  private useR2(): boolean {
    const d = this.config.get<string>('IMAGE_STORAGE_DRIVER')?.trim().toLowerCase();
    return d === 'r2' || d === 's3';
  }

  /** Responses to clients: DB value → absolute URL when stored as a relative key. */
  resolveToPublicUrl(stored: string | null | undefined): string | null {
    if (stored == null) return null;
    const t = stored.trim();
    if (t.length === 0) return null;
    if (t.startsWith('data:')) return t;
    if (/^https?:\/\//i.test(t)) return t;
    const key = t.replace(/^\/+/, '');
    if (this.useR2()) {
      const pub = this.r2PublicBase();
      if (!pub) {
        return key;
      }
      return `${pub}/${key}`;
    }
    return `${this.uploadsBase()}/${key}`;
  }

  /**
   * Before save: turn a user-submitted or upload-time full URL into a storage key.
   * Passes through `data:`, external http(s), and already-relative `images/...` keys.
   */
  stripToStorageKey(incoming: string | null | undefined): string | null {
    if (incoming == null) return null;
    const t = incoming.trim();
    if (t.length === 0) return null;
    if (t.startsWith('data:')) return t;
    if (t.startsWith('images/')) return t.replace(/^\/+/, '');

    const r2 = this.r2PublicBase();
    if (r2 && t.startsWith(r2)) {
      const rest = t.slice(r2.length).replace(/^\/+/, '');
      return rest.length ? rest : null;
    }

    const up = this.uploadsBase();
    if (t.startsWith(up)) {
      const rest = t.slice(up.length).replace(/^\/+/, '');
      return rest.length ? rest : null;
    }

    const api = this.uploadPublicBase();
    if (t.startsWith(`${api}/uploads/`)) {
      return t.slice(`${api}/uploads/`.length);
    }
    if (t.startsWith('/uploads/')) {
      return t.slice('/uploads/'.length);
    }

    if (/^https?:\/\//i.test(t)) {
      return t;
    }
    return t;
  }
}
