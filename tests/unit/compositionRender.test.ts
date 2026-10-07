import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderComposition } from '../../src/executors/composition';
import { compositionDefaults } from '../../src/core/composition';
import type { TransformObject } from '../../src/core/types';
const image = (id: string): TransformObject => ({
  id,
  type: 'image',
  name: id,
  mimeType: 'image/png',
  size: 1,
  createdAt: 1,
  metadata: { width: 2, height: 2 },
  storage: { kind: 'blob', blob: new Blob([id], { type: 'image/png' }) },
  preview: { objectId: id },
});
const inputs = [image('a'), image('b')];
afterEach(() => vi.unstubAllGlobals());
function setup(encoded: Blob | null = new Blob(['png'], { type: 'image/png' })) {
  const closes = [vi.fn(), vi.fn()];
  let n = 0;
  const decode = vi.fn(async () => ({ width: 2, height: 2, close: closes[n++] }));
  vi.stubGlobal('createImageBitmap', decode);
  const context = {
    fillStyle: '',
    fillRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    roundRect: vi.fn(),
    clip: vi.fn(),
    stroke: vi.fn(),
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => context,
    toBlob: (cb: (blob: Blob | null) => void) => cb(encoded),
  };
  vi.stubGlobal('document', { createElement: () => canvas });
  return { closes, decode, context, canvas };
}
describe('composition resource and failure boundaries', () => {
  it('releases the canvas when context allocation fails before decoding', async () => {
    const { canvas, decode } = setup();
    Object.assign(canvas, { getContext: () => null });
    await expect(renderComposition(inputs, compositionDefaults(inputs), false)).rejects.toThrow(
      'composition canvas',
    );
    expect(decode).not.toHaveBeenCalled();
    expect(canvas.width).toBe(0);
    expect(canvas.height).toBe(0);
  });
  it('decodes sequentially and closes each bitmap, then releases the canvas', async () => {
    const { closes, canvas, context } = setup();
    const result = await renderComposition(inputs, compositionDefaults(inputs), false);
    expect(result.blob.type).toBe('image/png');
    expect(context.drawImage).toHaveBeenCalledTimes(2);
    expect(closes.every((c) => c.mock.calls.length === 1)).toBe(true);
    expect(canvas.width).toBe(0);
    expect(canvas.height).toBe(0);
  });
  it('cleans up encoding failure and rejects silent format substitution', async () => {
    for (const blob of [null, new Blob(['wrong'], { type: 'image/jpeg' })]) {
      const { canvas, closes } = setup(blob);
      await expect(renderComposition(inputs, compositionDefaults(inputs), false)).rejects.toThrow(
        /encoding/,
      );
      expect(canvas.width).toBe(0);
      expect(closes.every((c) => c.mock.calls.length === 1)).toBe(true);
    }
  });
  it('stops cancelled previews before decode and releases a bitmap when cancelled during decode', async () => {
    let state = setup();
    const controller = new AbortController();
    controller.abort();
    await expect(
      renderComposition(inputs, compositionDefaults(inputs), false, { signal: controller.signal }),
    ).rejects.toThrow('cancelled');
    expect(state.decode).not.toHaveBeenCalled();
    expect(state.canvas.width).toBe(0);
    state = setup();
    const second = new AbortController();
    state.decode.mockImplementationOnce(async () => {
      second.abort();
      return { width: 2, height: 2, close: state.closes[0] };
    });
    await expect(
      renderComposition(inputs, compositionDefaults(inputs), false, { signal: second.signal }),
    ).rejects.toThrow('cancelled');
    expect(state.closes[0]).toHaveBeenCalledOnce();
    expect(state.decode).toHaveBeenCalledOnce();
  });
  it('closes earlier bitmaps and fails without drawing when a source is missing or metadata differs', async () => {
    let state = setup();
    await expect(
      renderComposition(
        [
          inputs[0],
          { ...inputs[1], storage: { kind: 'remote', objectId: 'missing', executorId: 'none' } },
        ],
        compositionDefaults(inputs),
        false,
      ),
    ).rejects.toThrow();
    expect(state.closes[0]).toHaveBeenCalledOnce();
    expect(state.canvas.width).toBe(0);
    state = setup();
    state.decode.mockResolvedValueOnce({ width: 3, height: 2, close: state.closes[0] });
    await expect(renderComposition(inputs, compositionDefaults(inputs), false)).rejects.toThrow(
      'saved dimensions',
    );
    expect(state.closes[0]).toHaveBeenCalledOnce();
    expect(state.context.drawImage).not.toHaveBeenCalled();
  });
});
