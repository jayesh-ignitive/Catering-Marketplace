import sharp from 'sharp';
import { optimizeUploadedImage } from './optimize-uploaded-image';

describe('optimizeUploadedImage', () => {
  it('shrinks a large jpeg into webp within the gallery limit', async () => {
    const source = await sharp({
      create: {
        width: 3200,
        height: 2400,
        channels: 3,
        background: { r: 180, g: 40, b: 40 },
      },
    })
      .jpeg({ quality: 95 })
      .toBuffer();

    const optimized = await optimizeUploadedImage(source, 'image/jpeg', 'gallery');
    expect(optimized.mimeType).toBe('image/webp');
    expect(optimized.buffer.length).toBeLessThan(source.length);

    const meta = await sharp(optimized.buffer).metadata();
    expect(meta.width).toBeLessThanOrEqual(1600);
    expect(meta.height).toBeLessThanOrEqual(1600);
    expect(meta.format).toBe('webp');
  });

  it('keeps a tiny already-webp file when re-encoding does not help', async () => {
    const source = await sharp({
      create: {
        width: 32,
        height: 32,
        channels: 3,
        background: { r: 10, g: 20, b: 30 },
      },
    })
      .webp({ quality: 40 })
      .toBuffer();

    const optimized = await optimizeUploadedImage(source, 'image/webp', 'banner');
    expect(optimized.buffer.equals(source)).toBe(true);
    expect(optimized.mimeType).toBe('image/webp');
  });
});
