// U²-Net preprocessing: per-image RGB maximum, ImageNet normalization, NCHW.
export function normalizedRgb(rgba: Uint8ClampedArray): Float32Array {
  const count = rgba.length / 4;
  let max = 1;
  for (let i = 0; i < rgba.length; i += 4) max = Math.max(max, rgba[i], rgba[i + 1], rgba[i + 2]);
  const means = [0.485, 0.456, 0.406],
    stds = [0.229, 0.224, 0.225];
  const result = new Float32Array(count * 3);
  for (let i = 0; i < count; i++)
    for (let channel = 0; channel < 3; channel++)
      result[channel * count + i] = (rgba[i * 4 + channel] / max - means[channel]) / stds[channel];
  return result;
}
export function alphaMask(values: Float32Array): Uint8ClampedArray<ArrayBuffer> {
  let min = Infinity,
    max = -Infinity;
  for (const value of values) {
    if (!Number.isFinite(value)) throw new Error('The background model returned an invalid mask.');
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  const range = max - min;
  const pixels = new Uint8ClampedArray(values.length * 4);
  for (let i = 0; i < values.length; i++) {
    pixels[i * 4] = pixels[i * 4 + 1] = pixels[i * 4 + 2] = 255;
    pixels[i * 4 + 3] = Math.round(
      Math.min(1, Math.max(0, range > 1e-6 ? (values[i] - min) / range : values[i])) * 255,
    );
  }
  return pixels;
}
