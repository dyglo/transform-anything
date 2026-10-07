import { afterEach, describe, expect, it, vi } from 'vitest';
import { detectImageMime } from '../../src/core/detection';
import { importImage } from '../../src/executors/local';
const png = [137, 80, 78, 71, 13, 10, 26, 10];
afterEach(() => vi.unstubAllGlobals());
describe('actual image representation detection', () => {
  it('recognizes PNG/JPEG/WebP signatures and rejects truncated or unrelated content', () => {
    expect(detectImageMime(new Uint8Array(png))).toBe('image/png');
    expect(detectImageMime(new Uint8Array([255, 216, 255]))).toBe('image/jpeg');
    expect(detectImageMime(new Uint8Array([82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80]))).toBe(
      'image/webp',
    );
    for (const bytes of [
      [],
      [137, 80],
      [82, 73, 70, 70, 0, 0, 0, 0, 65, 86, 73, 32],
      [60, 115, 118, 103],
    ])
      expect(detectImageMime(new Uint8Array(bytes))).toBeNull();
  });
  it('uses decoded signature MIME even with a missing or incorrect browser hint', async () => {
    const close = vi.fn();
    vi.stubGlobal('createImageBitmap', async () => ({ width: 20, height: 10, close }));
    for (const hint of ['', 'image/jpeg', 'application/octet-stream']) {
      const o = await importImage(new File([new Uint8Array(png)], 'misnamed.jpg', { type: hint }));
      expect(o.mimeType).toBe('image/png');
      expect(o.metadata).toEqual({ width: 20, height: 10 });
      expect(o.storage.kind === 'blob' && o.storage.blob.type).toBe('image/png');
    }
    expect(close).toHaveBeenCalledTimes(3);
  });
  it('rejects damage before decoding, but still decodes valid signatures to reject corrupt images', async () => {
    const decode = vi.fn(async () => {
      throw new Error('Corrupt');
    });
    vi.stubGlobal('createImageBitmap', decode);
    await expect(importImage(new File(['fake'], 'bad.png', { type: 'image/png' }))).rejects.toThrow(
      'damaged',
    );
    expect(decode).not.toHaveBeenCalled();
    await expect(
      importImage(new File([new Uint8Array(png)], 'bad.png', { type: 'image/png' })),
    ).rejects.toThrow('damaged');
    expect(decode).toHaveBeenCalledOnce();
  });
});
