import { describe, expect, it } from 'vitest';
import { alphaMask, normalizedRgb } from '../../src/executors/backgroundMath';
import { registry } from '../../src/core/registry';
describe('background removal', () => {
  it('maps RGB into finite planar model input, including black images', () => {
    const data = normalizedRgb(new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255]));
    expect(data).toHaveLength(6);
    expect(data[0]).toBeCloseTo((1 - 0.485) / 0.229);
    expect(data[1]).toBeCloseTo(-0.485 / 0.229);
    expect([...normalizedRgb(new Uint8ClampedArray([0, 0, 0, 255]))].every(Number.isFinite)).toBe(
      true,
    );
  });
  it('produces a soft alpha matte without altering color channels', () => {
    expect([...alphaMask(new Float32Array([0.1, 0.5, 0.9]))]).toEqual([
      255, 255, 255, 0, 255, 255, 255, 128, 255, 255, 255, 255,
    ]);
    expect([...alphaMask(new Float32Array([0, 0]))]).toEqual([255, 255, 255, 0, 255, 255, 255, 0]);
    expect(() => alphaMask(new Float32Array([NaN]))).toThrow('invalid mask');
  });
  it('registers a local PNG-producing operation for every supported image format', () => {
    const operation = registry.find((op) => op.id === 'remove-bg')!;
    expect(operation.execution).toBe('local-background');
    expect(operation.produces).toEqual(['image/png']);
    expect(operation.accepts).toEqual(['image/png', 'image/jpeg', 'image/webp']);
  });
});
