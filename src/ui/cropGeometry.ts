import type { Parameters } from '../core/types';

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
export type CropHandle = 'move' | 'nw' | 'ne' | 'sw' | 'se';
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
export function boundedCrop(parameters: Parameters, width: number, height: number): CropRect {
  const integer = (key: string, fallback: number) =>
    Number.isFinite(Number(parameters[key])) ? Math.round(Number(parameters[key])) : fallback;
  const x = clamp(integer('x', 0), 0, width - 1),
    y = clamp(integer('y', 0), 0, height - 1);
  return {
    x,
    y,
    width: clamp(integer('width', width), 1, width - x),
    height: clamp(integer('height', height), 1, height - y),
  };
}
// Work in source-image pixels; the overlay converts displayed pointer deltas first.
export function adjustCrop(
  start: CropRect,
  handle: CropHandle,
  dx: number,
  dy: number,
  width: number,
  height: number,
): CropRect {
  if (handle === 'move')
    return {
      ...start,
      x: clamp(Math.round(start.x + dx), 0, width - start.width),
      y: clamp(Math.round(start.y + dy), 0, height - start.height),
    };
  let left = start.x,
    top = start.y,
    right = start.x + start.width,
    bottom = start.y + start.height;
  if (handle.includes('w')) left = clamp(Math.round(left + dx), 0, right - 1);
  if (handle.includes('e')) right = clamp(Math.round(right + dx), left + 1, width);
  if (handle.includes('n')) top = clamp(Math.round(top + dy), 0, bottom - 1);
  if (handle.includes('s')) bottom = clamp(Math.round(bottom + dy), top + 1, height);
  return { x: left, y: top, width: right - left, height: bottom - top };
}
