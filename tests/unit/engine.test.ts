import { describe, it, expect, vi } from 'vitest';
import { appendResult, executeTransformation } from '../../src/core/engine';
import { compatible, registry } from '../../src/core/registry';
import { newSession, type Executor, type TransformObject } from '../../src/core/types';
const original: TransformObject = {
  id: 'original',
  type: 'image',
  name: 'test.png',
  mimeType: 'image/png',
  size: 1,
  createdAt: 1,
  metadata: { width: 100, height: 80 },
  storage: { kind: 'blob', blob: new Blob(['test'], { type: 'image/png' }) },
  preview: { objectId: 'original' },
};
const resize = registry.find((o) => o.id === 'resize')!;
describe('shared transformation engine', () => {
  it('preserves originals and branches from the selected input', async () => {
    let n = 0;
    const executor: Executor = {
      supports: () => true,
      execute: async (o) => ({ ...o, id: `output-${++n}` }),
    };
    const session = { ...newSession(), objects: [original], activeId: original.id };
    const first = await executeTransformation(original, resize, { width: 50, height: 40 }, [
      executor,
    ]);
    const second = await executeTransformation(original, resize, { width: 25, height: 20 }, [
      executor,
    ]);
    const final = appendResult(appendResult(session, first), second);
    expect(final.objects).toHaveLength(3);
    expect(final.objects[0]).toBe(original);
    expect(final.operations.map((o) => o.inputIds)).toEqual([['original'], ['original']]);
    expect(final.activeId).toBe('output-2');
    expect(final.operations[0].version).toBe(1);
  });
  it('rejects invalid dimensions before processing', async () => {
    const execute = vi.fn();
    await expect(
      executeTransformation(original, resize, { width: -1, height: 80 }, [
        { supports: () => true, execute },
      ]),
    ).rejects.toThrow('width');
    expect(execute).not.toHaveBeenCalled();
  });
  it('rejects excessive output size and out-of-bounds crops', () => {
    expect(() => resize.validate({ width: 10000, height: 10000 }, original)).toThrow(
      '40 megapixels',
    );
    expect(() => registry[0].validate({ x: 99, y: 0, width: 2, height: 1 }, original)).toThrow(
      'fit inside',
    );
    expect(() => registry[0].validate({ x: 0.5, y: 0, width: 2, height: 1 }, original)).toThrow(
      'whole number',
    );
  });
  it('resolves compatible operations without exposing planned features', () => {
    expect(compatible(original).map((o) => o.id)).toEqual([
      'crop',
      'resize',
      'rotate',
      'convert',
      'remove-bg',
      'annotate',
    ]);
    expect(compatible({ ...original, mimeType: 'image/jpeg' }).map((o) => o.id)).toContain(
      'compress',
    );
    expect(compatible({ ...original, mimeType: 'application/pdf' })).toEqual([]);
  });
  it('validates output format, quality, and rotation', () => {
    for (const p of [
      { format: 'image/avif', quality: 90 },
      { format: 'image/jpeg', quality: 0 },
      { format: 'image/jpeg', quality: 101 },
    ])
      expect(() => registry[3].validate(p, original)).toThrow();
    expect(() => registry[2].validate({ angle: 45 }, original)).toThrow();
  });
  it('rejects missing executors and wrong output MIME types', async () => {
    await expect(
      executeTransformation(original, resize, { width: 10, height: 10 }, []),
    ).rejects.toThrow('not available');
    await expect(
      executeTransformation(original, resize, { width: 10, height: 10 }, [
        { supports: () => true, execute: async () => ({ ...original, mimeType: 'text/plain' }) },
      ]),
    ).rejects.toThrow('output format');
  });
  it('leaves the graph intact when processing fails', async () => {
    const session = { ...newSession(), objects: [original] };
    await expect(
      executeTransformation(original, resize, { width: 10, height: 10 }, [
        {
          supports: () => true,
          execute: async () => {
            throw new Error('failed');
          },
        },
      ]),
    ).rejects.toThrow('failed');
    expect(session.objects).toEqual([original]);
    expect(session.operations).toEqual([]);
  });
});
