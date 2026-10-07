// Pixel-aligned regions cover every pixel touched by a fractional selection.
export function pixelBounds(e: { x: number; y: number; width: number; height: number }) {
  const x = Math.floor(e.x),
    y = Math.floor(e.y);
  return { x, y, width: Math.ceil(e.x + e.width) - x, height: Math.ceil(e.y + e.height) - y };
}

export const MAX_BLUR_PIXELS = 4_000_000;
