import { describe, expect, it } from 'vitest';
import { boxBlur } from '../../src/executors/regionPixels';
import { pixelBounds } from '../../src/core/regions';

describe('source-pixel region processing', () => {
  it('covers the entire fractional selection, including boundary pixels', () => {
    expect(pixelBounds({ x: 1.9, y: 2.1, width: 3.3, height: 4.8 })).toEqual({
      x: 1,
      y: 2,
      width: 5,
      height: 5,
    });
    expect(pixelBounds({ x: 0, y: 0, width: 1, height: 1 })).toEqual({
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    });
  });
  it('averages a high contrast region without mutating its source', () => {
    const data = new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 255]);
    const original = data.slice();
    expect(Array.from(boxBlur(data, 3, 1, 1))).toEqual([
      85, 85, 85, 255, 85, 85, 85, 255, 85, 85, 85, 255,
    ]);
    expect(data).toEqual(original);
  });
  it('premultiplies alpha so hidden source RGB cannot contaminate visible colors', () => {
    const data = new Uint8ClampedArray([255, 0, 0, 0, 0, 0, 255, 255, 255, 0, 0, 0]);
    expect(Array.from(boxBlur(data, 3, 1, 1))).toEqual([
      0, 0, 255, 85, 0, 0, 255, 85, 0, 0, 255, 85,
    ]);
    expect(Array.from(boxBlur(new Uint8ClampedArray([255, 0, 0, 0]), 1, 1, 64))).toEqual([
      0, 0, 0, 0,
    ]);
  });
});
