import { describe, it, expect } from 'vitest';
import { compositionDefaults, compositionPlan } from '../../src/core/composition';
import type { Parameters, TransformObject } from '../../src/core/types';
const image = (id: string, width: number, height: number): TransformObject => ({
  id,
  type: 'image',
  name: id + '.png',
  mimeType: 'image/png',
  size: 1,
  createdAt: 1,
  metadata: { width, height },
  storage: { kind: 'blob', blob: new Blob() },
  preview: { objectId: id },
});
const inputs = [image('a', 40, 20), image('b', 20, 40)];
describe('composition geometry and budgets', () => {
  it('keeps native sizes and computes ordered placements, gaps, padding and alignment', () => {
    const p = { ...compositionDefaults(inputs), gap: 10, padding: 5 };
    expect(compositionPlan(inputs, p)).toMatchObject({
      width: 80,
      height: 50,
      placements: [
        { x: 5, y: 15, width: 40, height: 20 },
        { x: 55, y: 5, width: 20, height: 40 },
      ],
    });
    expect(compositionPlan([...inputs].reverse(), { ...p, alignment: 'end' }).placements).toEqual([
      { x: 5, y: 5, width: 20, height: 40 },
      { x: 35, y: 25, width: 40, height: 20 },
    ]);
    expect(
      compositionPlan(inputs, { ...p, direction: 'vertical', alignment: 'start' }),
    ).toMatchObject({
      width: 50,
      height: 80,
      placements: [
        { x: 5, y: 5, width: 40, height: 20 },
        { x: 5, y: 35, width: 20, height: 40 },
      ],
    });
  });
  it('matches a common dimension without stretching aspect ratios', () => {
    expect(
      compositionPlan(inputs, {
        ...compositionDefaults(inputs),
        padding: 0,
        gap: 0,
        sizing: 'match',
        crossSize: 40,
      }),
    ).toMatchObject({
      width: 100,
      height: 40,
      placements: [
        { x: 0, y: 0, width: 80, height: 40 },
        { x: 80, y: 0, width: 20, height: 40 },
      ],
    });
    expect(
      compositionPlan(inputs, {
        ...compositionDefaults(inputs),
        direction: 'vertical',
        padding: 0,
        gap: 0,
        sizing: 'match',
        crossSize: 40,
      }),
    ).toMatchObject({ width: 40, height: 100 });
  });
  it('accounts for an outside border and padding and bounds corners', () => {
    expect(
      compositionPlan(
        [inputs[0]],
        { ...compositionDefaults(inputs, true), padding: 5, border: 2, radius: 3 },
        true,
      ),
    ).toMatchObject({
      width: 54,
      height: 34,
      placements: [{ x: 7, y: 7, width: 40, height: 20 }],
      radius: 3,
      border: 2,
    });
    expect(() =>
      compositionPlan([inputs[0]], { ...compositionDefaults(inputs, true), radius: 11 }, true),
    ).toThrow('radius');
  });
  it('rejects unsafe parameters, source budgets and output budgets before allocating', () => {
    const p = compositionDefaults(inputs);
    for (const bad of [
      { padding: -1 },
      { gap: 0.5 },
      { padding: '' },
      { background: 'red' },
      { direction: 'diagonal' },
      { sizing: 'stretch' },
      { crossSize: 0 },
      { padding: 16384 },
    ] as Parameters[])
      expect(() => compositionPlan(inputs, { ...p, ...bad })).toThrow();
    expect(() => compositionPlan([inputs[0]], p)).toThrow('2–8');
    expect(() =>
      compositionPlan(
        Array.from({ length: 9 }, (_, i) => image(String(i), 1, 1)),
        p,
      ),
    ).toThrow('2–8');
    expect(() => compositionPlan([image('a', 7000, 4000), image('b', 7000, 4000)], p)).toThrow(
      'total 40',
    );
    expect(() =>
      compositionPlan([image('a', 16384, 1), image('b', 1, 1)], { ...p, padding: 0, gap: 0 }),
    ).toThrow('fit');
    expect(() => compositionPlan([image('a', NaN, 1), inputs[1]], p)).toThrow('dimensions');
  });
});
