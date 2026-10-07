import type { ImageMime } from './types';

// Identify actual representation; an extension or browser MIME hint is not proof.
export function detectImageMime(header: Uint8Array): ImageMime | null {
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => header[i] === b)) return 'image/png';
  if (header[0] === 255 && header[1] === 216 && header[2] === 255) return 'image/jpeg';
  if (
    header.length >= 12 &&
    [82, 73, 70, 70].every((b, i) => header[i] === b) &&
    [87, 69, 66, 80].every((b, i) => header[i + 8] === b)
  )
    return 'image/webp';
  return null;
}
