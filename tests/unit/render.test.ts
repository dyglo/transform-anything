import { afterEach, describe, it, expect, vi } from 'vitest';
import { renderImage } from '../../src/executors/render';
afterEach(() => vi.unstubAllGlobals());
describe('canvas encoding', () => {
  it('uses the main-thread fallback when OffscreenCanvas is absent', async () => {
    vi.stubGlobal('OffscreenCanvas', undefined);
    vi.stubGlobal('createImageBitmap', async () => ({ width: 2, height: 3, close: vi.fn() }));
    vi.stubGlobal('document', {
      createElement: () => ({
        getContext: () => ({ drawImage: vi.fn() }),
        toBlob: (cb: (b: Blob) => void, type: string) => cb(new Blob(['png'], { type })),
      }),
    });
    const result = await renderImage(
      {
        blob: new Blob(),
        mime: 'image/png',
        operation: 'resize',
        parameters: { width: 1, height: 1 },
      },
      false,
    );
    expect(result.blob.type).toBe('image/png');
    expect(result.width).toBe(1);
  });
  it('rejects silent encoder fallback and closes the bitmap', async () => {
    const close = vi.fn();
    vi.stubGlobal('createImageBitmap', async () => ({ width: 1, height: 1, close }));
    class Canvas {
      getContext() {
        return { drawImage: vi.fn() };
      }
      async convertToBlob() {
        return new Blob(['png'], { type: 'image/png' });
      }
    }
    vi.stubGlobal('OffscreenCanvas', Canvas);
    await expect(
      renderImage(
        { blob: new Blob(), mime: 'image/webp', operation: 'convert', parameters: { quality: 80 } },
        true,
      ),
    ).rejects.toThrow('cannot export WEBP');
    expect(close).toHaveBeenCalledOnce();
  });
  it('flattens alpha onto white for JPEG but preserves alpha for PNG', async () => {
    const fillRect = vi.fn();
    const context = { fillRect, drawImage: vi.fn(), fillStyle: '' };
    vi.stubGlobal('createImageBitmap', async () => ({ width: 1, height: 1, close: vi.fn() }));
    class Canvas {
      getContext() {
        return context;
      }
      async convertToBlob({ type }: { type: string }) {
        return new Blob(['encoded'], { type });
      }
    }
    vi.stubGlobal('OffscreenCanvas', Canvas);
    await renderImage(
      { blob: new Blob(), mime: 'image/jpeg', operation: 'convert', parameters: {} },
      true,
    );
    expect(context.fillStyle).toBe('#ffffff');
    expect(fillRect).toHaveBeenCalledOnce();
    fillRect.mockClear();
    await renderImage(
      { blob: new Blob(), mime: 'image/png', operation: 'convert', parameters: {} },
      true,
    );
    expect(fillRect).not.toHaveBeenCalled();
  });
});
