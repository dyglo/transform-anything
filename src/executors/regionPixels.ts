// A bounded, separable box blur. Average premultiplied colors to prevent hidden
// RGB in transparent pixels bleeding into visible output. Clamp at region edges.
export function boxBlur(data: Uint8ClampedArray, width: number, height: number, radius: number) {
  const horizontal = new Float32Array(data.length);
  const output = new Uint8ClampedArray(data.length);
  const window = radius * 2 + 1;
  for (let y = 0; y < height; y++) {
    const sums = [0, 0, 0, 0];
    const add = (x: number, sign: number) => {
      const i = (y * width + Math.max(0, Math.min(width - 1, x))) * 4;
      const alpha = data[i + 3] / 255;
      for (let c = 0; c < 3; c++) sums[c] += sign * data[i + c] * alpha;
      sums[3] += sign * data[i + 3];
    };
    for (let x = -radius; x <= radius; x++) add(x, 1);
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      for (let c = 0; c < 4; c++) horizontal[i + c] = sums[c] / window;
      add(x - radius, -1);
      add(x + radius + 1, 1);
    }
  }
  for (let x = 0; x < width; x++) {
    const sums = [0, 0, 0, 0];
    const add = (y: number, sign: number) => {
      const i = (Math.max(0, Math.min(height - 1, y)) * width + x) * 4;
      for (let c = 0; c < 4; c++) sums[c] += sign * horizontal[i + c];
    };
    for (let y = -radius; y <= radius; y++) add(y, 1);
    for (let y = 0; y < height; y++) {
      const i = (y * width + x) * 4;
      const alpha = sums[3] / window;
      output[i + 3] = alpha;
      for (let c = 0; c < 3; c++)
        output[i + c] = alpha > 0 ? ((sums[c] / window) * 255) / alpha : 0;
      add(y - radius, -1);
      add(y + radius + 1, 1);
    }
  }
  return output;
}
