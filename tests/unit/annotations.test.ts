import { afterEach, describe, expect, it, vi } from 'vitest';
import { adjustAnnotation, validateAnnotations } from '../../src/core/annotations';
import { executeTransformation } from '../../src/core/engine';
import { registry } from '../../src/core/registry';
import { drawAnnotations, renderAnnotations } from '../../src/executors/annotations';
import type { AnnotationElement, TransformObject } from '../../src/core/types';
const object = {
  id: 'source',
  mimeType: 'image/png',
  metadata: { width: 400, height: 300 },
} as TransformObject;
const element: AnnotationElement = {
  id: 'a',
  kind: 'text',
  x: 10,
  y: 20,
  width: 100,
  height: 50,
  color: '#ff0000',
  stroke: 3,
  opacity: 1,
  fontSize: 20,
  text: 'Hello',
  flipX: false,
  flipY: false,
};
const op = registry.find((o) => o.id === 'annotate')!;
afterEach(() => vi.unstubAllGlobals());
describe('annotation schema and source geometry', () => {
  it('accepts each kind and rejects malformed documents and bounds', () => {
    for (const kind of ['text', 'arrow', 'rectangle', 'highlight'] as const)
      expect(() =>
        validateAnnotations({ version: 1, elements: [{ ...element, kind, opacity: 0.5 }] }, object),
      ).not.toThrow();
    for (const doc of [
      null,
      { version: 99, elements: [element] },
      { version: 1, elements: [] },
      { version: 1, elements: [element, element] },
      { version: 1, elements: new Array(101).fill(element) },
    ])
      expect(() => validateAnnotations(doc, object)).toThrow('Invalid annotations');
    for (const patch of [
      { x: -1 },
      { width: 0 },
      { height: Infinity },
      { x: 390 },
      { stroke: 101 },
      { fontSize: 0 },
      { opacity: 1.1 },
      { opacity: 0 },
      { color: 'red' },
      { text: '' },
      { text: ' '.repeat(5) },
      { text: 'x'.repeat(501) },
      { flipX: 1 },
      { kind: 'script' },
      { x: '10' },
    ])
      expect(() =>
        validateAnnotations({ version: 1, elements: [{ ...element, ...patch }] }, object),
      ).toThrow();
    expect(() =>
      validateAnnotations(
        { version: 1, elements: [{ ...element, kind: 'highlight', opacity: 1 }] },
        object,
      ),
    ).toThrow();
  });
  it('clamps moves and resize while preserving the fixed origin', () => {
    expect(adjustAnnotation(element, 'move', 900, -200, 400, 300)).toMatchObject({
      x: 300,
      y: 0,
      width: 100,
    });
    expect(adjustAnnotation(element, 'resize', 900, -200, 400, 300)).toMatchObject({
      x: 10,
      y: 20,
      width: 390,
      height: 1,
    });
  });
  it('validates before executing and takes an independent structured parameter snapshot', async () => {
    const execute = vi.fn(async () => ({ ...object, id: 'out' }));
    await expect(
      executeTransformation(object, op, { annotations: { version: 1, elements: [] } }, [
        { supports: () => true, execute },
      ]),
    ).rejects.toThrow();
    expect(execute).not.toHaveBeenCalled();
    const doc = { version: 1 as const, elements: [{ ...element }] };
    const result = await executeTransformation(object, op, { annotations: doc }, [
      { supports: () => true, execute },
    ]);
    doc.elements[0].text = 'Changed';
    expect(result.operation.parameters.annotations).toMatchObject({
      elements: [{ text: 'Hello' }],
    });
    expect(result.operation.inputIds).toEqual(['source']);
    expect(result.operation.outputIds).toEqual(['out']);
  });
});
describe('annotation rendering', () => {
  it('wraps and clips text, scopes opacity, and draws all primitive types', () => {
    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      fillText: vi.fn(),
      measureText: (s: string) => ({ width: s.length * 30 }),
    };
    drawAnnotations(ctx as unknown as CanvasRenderingContext2D, {
      version: 1,
      elements: ['text', 'arrow', 'rectangle', 'highlight'].map(
        (kind, i) => ({ ...element, id: String(i), kind }) as AnnotationElement,
      ),
    });
    expect(ctx.clip).toHaveBeenCalledTimes(4);
    expect(ctx.restore).toHaveBeenCalledTimes(4);
    expect(ctx.fillText.mock.calls.map((c) => c[0])).toEqual(['Hel', 'lo']);
    expect(ctx.fillRect).toHaveBeenCalledOnce();
    expect(ctx.strokeRect).toHaveBeenCalledOnce();
    expect(ctx.stroke).toHaveBeenCalledOnce();
  });
  it('closes the bitmap on canvas and encoding failures', async () => {
    const close = vi.fn();
    vi.stubGlobal('createImageBitmap', async () => ({ width: 400, height: 300, close }));
    vi.stubGlobal('document', { createElement: () => ({ getContext: () => null }) });
    await expect(
      renderAnnotations(new Blob(), { version: 1, elements: [element] }),
    ).rejects.toThrow('canvas');
    expect(close).toHaveBeenCalledOnce();
    vi.stubGlobal('document', {
      createElement: () => ({
        getContext: () => ({
          drawImage: vi.fn(),
          save: vi.fn(),
          restore: vi.fn(),
          beginPath: vi.fn(),
          rect: vi.fn(),
          clip: vi.fn(),
          fillText: vi.fn(),
          measureText: () => ({ width: 1 }),
        }),
        toBlob: (cb: (b: null) => void) => cb(null),
      }),
    });
    await expect(
      renderAnnotations(new Blob(), { version: 1, elements: [element] }),
    ).rejects.toThrow('encoding');
    expect(close).toHaveBeenCalledTimes(2);
  });
});

describe('versioned blur and redaction contract', () => {
  const redaction = { ...element, kind: 'redact' as const, text: '' };
  const blur = { ...element, kind: 'blur' as const, blurRadius: 12, text: '' };
  it('retains v1 schemas and rejects new kinds in historical versions', () => {
    expect(() => validateAnnotations({ version: 1, elements: [element] }, object)).not.toThrow();
    for (const e of [redaction, blur]) {
      expect(() => validateAnnotations({ version: 1, elements: [e] }, object)).toThrow();
      expect(() => validateAnnotations({ version: 2, elements: [e] }, object)).not.toThrow();
    }
  });
  it('rejects translucent masks, invalid radii and excessive blur allocation before execution', async () => {
    const execute = vi.fn();
    for (const e of [
      { ...redaction, opacity: 0.99 },
      { ...blur, opacity: 0.5 },
      { ...blur, blurRadius: 0 },
      { ...blur, blurRadius: 65 },
      { ...blur, blurRadius: 1.5 },
      { ...blur, blurRadius: undefined },
    ]) {
      await expect(
        executeTransformation(object, op, { annotations: { version: 2, elements: [e] } }, [
          { supports: () => true, execute },
        ]),
      ).rejects.toThrow();
    }
    const large = { ...object, metadata: { width: 4000, height: 4000 } };
    expect(() =>
      validateAnnotations(
        { version: 2, elements: [{ ...blur, x: 0, y: 0, width: 3000, height: 3000 }] },
        large,
      ),
    ).toThrow('4 megapixels');
    expect(() =>
      validateAnnotations(
        { version: 2, elements: [{ ...redaction, x: 0, y: 0, width: 4000, height: 4000 }] },
        large,
      ),
    ).not.toThrow();
    expect(execute).not.toHaveBeenCalled();
  });
});
