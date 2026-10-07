import { MAX_PIXELS, type Parameters, type TransformObject } from './types';
export interface Placement {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface CompositionPlan {
  width: number;
  height: number;
  placements: Placement[];
  background: string;
  padding: number;
  border: number;
  radius: number;
  borderColor: string;
}
function integer(p: Parameters, key: string, min = 0, max = 16384) {
  if (typeof p[key] !== 'number' && typeof p[key] !== 'string')
    throw new Error(`${key} must be a whole number.`);
  if (typeof p[key] === 'string' && !String(p[key]).trim())
    throw new Error(`${key} must be a whole number.`);
  const value = Number(p[key]);
  if (p[key] === '' || !Number.isSafeInteger(value) || value < min || value > max)
    throw new Error(`${key} must be a whole number from ${min} to ${max}.`);
  return value;
}
function color(value: unknown, transparent = false): string {
  if (transparent && value === 'transparent') return 'transparent';
  if (typeof value !== 'string' || !/^#[0-9a-f]{6}$/i.test(value))
    throw new Error('Choose a six-digit color or a transparent background.');
  return value;
}
export function compositionDefaults(
  objects: readonly TransformObject[],
  frame = false,
): Parameters {
  return frame
    ? {
        padding: 24,
        border: 2,
        radius: Math.min(
          12,
          Math.floor(
            Math.min(objects[0]?.metadata.width ?? 1, objects[0]?.metadata.height ?? 1) / 2,
          ),
        ),
        background: '#eef2f6',
        borderColor: '#ffffff',
      }
    : {
        direction: 'horizontal',
        gap: 16,
        padding: 16,
        background: 'transparent',
        alignment: 'center',
        sizing: 'native',
        crossSize: Math.max(1, ...objects.map((o) => o.metadata.height ?? 1)),
      };
}
export function compositionPlan(
  objects: readonly TransformObject[],
  p: Parameters,
  frame = false,
): CompositionPlan {
  if (objects.length < (frame ? 1 : 2) || objects.length > (frame ? 1 : 8))
    throw new Error(frame ? 'Choose one image to frame.' : 'Choose 2–8 images to combine.');
  let pixels = 0;
  for (const o of objects) {
    const { width, height } = o.metadata;
    if (
      !Number.isSafeInteger(width) ||
      !Number.isSafeInteger(height) ||
      width! < 1 ||
      height! < 1 ||
      width! > 16384 ||
      height! > 16384
    )
      throw new Error('An image has invalid dimensions. Import it again.');
    pixels += width! * height!;
  }
  if (pixels > MAX_PIXELS)
    throw new Error('Selected images must total 40 megapixels or less. Resize them first.');
  const padding = integer(p, 'padding'),
    background = color(p.background, true);
  let width: number,
    height: number,
    placements: Placement[],
    border = 0,
    radius = 0,
    borderColor = '#ffffff';
  if (frame) {
    border = integer(p, 'border', 0, 512);
    radius = integer(p, 'radius', 0, 8192);
    borderColor = color(p.borderColor);
    const o = objects[0];
    const x = padding + border;
    width = o.metadata.width! + x * 2;
    height = o.metadata.height! + x * 2;
    if (radius > Math.min(o.metadata.width!, o.metadata.height!) / 2)
      throw new Error('Corner radius must fit the image.');
    placements = [{ x, y: x, width: o.metadata.width!, height: o.metadata.height! }];
  } else {
    if (
      !['horizontal', 'vertical'].includes(String(p.direction)) ||
      !['start', 'center', 'end'].includes(String(p.alignment)) ||
      !['native', 'match'].includes(String(p.sizing))
    )
      throw new Error('Choose a valid direction, alignment and image sizing.');
    const horizontal = p.direction === 'horizontal',
      gap = integer(p, 'gap');
    const cross = integer(p, 'crossSize', 1);
    const sizes = objects.map((o) => {
      const w = o.metadata.width!,
        h = o.metadata.height!;
      const scale = p.sizing === 'match' ? cross / (horizontal ? h : w) : 1;
      return {
        width: Math.max(1, Math.round(w * scale)),
        height: Math.max(1, Math.round(h * scale)),
      };
    });
    const axis =
      sizes.reduce((sum, s) => sum + (horizontal ? s.width : s.height), 0) +
      gap * (sizes.length - 1);
    const maxCross = Math.max(...sizes.map((s) => (horizontal ? s.height : s.width)));
    width = (horizontal ? axis : maxCross) + padding * 2;
    height = (horizontal ? maxCross : axis) + padding * 2;
    let cursor = padding;
    placements = sizes.map((s) => {
      const remaining = maxCross - (horizontal ? s.height : s.width);
      const offset =
        p.alignment === 'start' ? 0 : p.alignment === 'end' ? remaining : Math.floor(remaining / 2);
      const placement = {
        ...s,
        x: horizontal ? cursor : padding + offset,
        y: horizontal ? padding + offset : cursor,
      };
      cursor += (horizontal ? s.width : s.height) + gap;
      return placement;
    });
  }
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width > 16384 ||
    height > 16384 ||
    width * height > MAX_PIXELS
  )
    throw new Error(
      'Composition must fit 16,384px per side and 40 megapixels. Reduce padding, gaps or image sizes.',
    );
  return { width, height, placements, background, padding, border, radius, borderColor };
}
