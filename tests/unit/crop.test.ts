import { describe, expect, it } from 'vitest';
import { adjustCrop, boundedCrop } from '../../src/ui/cropGeometry';
describe('crop interaction bounds', () => {
  it('moves the selection without resizing and stops at image edges', () => {
    expect(
      adjustCrop({ x: 20, y: 30, width: 100, height: 80 }, 'move', -500, 500, 200, 150),
    ).toEqual({ x: 0, y: 70, width: 100, height: 80 });
  });
  it('keeps the opposite corner fixed and prevents crossing or leaving the image', () => {
    const start = { x: 20, y: 30, width: 100, height: 80 };
    expect(adjustCrop(start, 'nw', 10, 15, 200, 150)).toEqual({
      x: 30,
      y: 45,
      width: 90,
      height: 65,
    });
    expect(adjustCrop(start, 'se', 500, 500, 200, 150)).toEqual({
      x: 20,
      y: 30,
      width: 180,
      height: 120,
    });
    expect(adjustCrop(start, 'ne', -500, 500, 200, 150)).toEqual({
      x: 20,
      y: 109,
      width: 1,
      height: 1,
    });
    expect(adjustCrop(start, 'sw', 500, -500, 200, 150)).toEqual({
      x: 119,
      y: 30,
      width: 1,
      height: 1,
    });
  });
  it('recovers a valid rectangle from out-of-range numeric input before dragging', () => {
    expect(boundedCrop({ x: 12, y: 21, width: 900, height: 827 }, 736, 808)).toEqual({
      x: 12,
      y: 21,
      width: 724,
      height: 787,
    });
  });
});
