/// <reference lib="webworker" />
import * as ort from 'onnxruntime-web/wasm';
import wasmUrl from 'onnxruntime-web/ort-wasm-simd-threaded.wasm?url';
import { alphaMask, normalizedRgb } from './backgroundMath';
const SIZE = 320;
const MODEL_HASH = '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8';
const progress = (message: string) => self.postMessage({ progress: message });
async function modelBytes(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url, { cache: 'force-cache' });
  if (!response.ok)
    throw new Error('Could not load the background model. Check your connection and retry.');
  const bytes = await response.arrayBuffer();
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
  if (hash !== MODEL_HASH)
    throw new Error('The background model is incomplete or damaged. Reload and retry.');
  return bytes;
}
self.onmessage = async (event: MessageEvent<{ blob: Blob; modelUrl: string }>) => {
  let bitmap: ImageBitmap | undefined;
  let session: ort.InferenceSession | undefined;
  try {
    progress('Loading background remover… First use can take a moment.');
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.proxy = false;
    ort.env.wasm.wasmPaths = { wasm: new URL(wasmUrl, self.location.href).href };
    session = await ort.InferenceSession.create(await modelBytes(event.data.modelUrl), {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    });
    bitmap = await createImageBitmap(event.data.blob, { imageOrientation: 'from-image' });
    const width = bitmap.width,
      height = bitmap.height;
    const canvas = new OffscreenCanvas(width, height),
      context = canvas.getContext('2d');
    const input = new OffscreenCanvas(SIZE, SIZE),
      inputContext = input.getContext('2d', { willReadFrequently: true });
    if (!context || !inputContext)
      throw new Error('Your browser could not create an image canvas.');
    context.drawImage(bitmap, 0, 0);
    inputContext.fillStyle = '#fff';
    inputContext.fillRect(0, 0, SIZE, SIZE);
    inputContext.drawImage(bitmap, 0, 0, SIZE, SIZE);
    bitmap.close();
    bitmap = undefined;
    progress('Finding the subject on your device…');
    const tensor = new ort.Tensor(
      'float32',
      normalizedRgb(inputContext.getImageData(0, 0, SIZE, SIZE).data),
      [1, 3, SIZE, SIZE],
    );
    const outputs = await session.run({ [session.inputNames[0]]: tensor });
    const output = outputs[session.outputNames[0]];
    if (!(output.data instanceof Float32Array) || output.data.length !== SIZE * SIZE)
      throw new Error('The background model returned an unexpected mask.');
    const mask = new OffscreenCanvas(SIZE, SIZE),
      maskContext = mask.getContext('2d');
    if (!maskContext) throw new Error('Could not create the background mask.');
    maskContext.putImageData(new ImageData(alphaMask(output.data), SIZE, SIZE), 0, 0);
    progress('Creating your transparent image…');
    context.globalCompositeOperation = 'destination-in';
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(mask, 0, 0, width, height);
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    await session.release();
    session = undefined;
    self.postMessage({ ok: true, result: { blob, width, height } });
  } catch (e) {
    self.postMessage({
      ok: false,
      error: e instanceof Error ? e.message : 'Background removal failed. Try a smaller image.',
    });
  } finally {
    bitmap?.close();
    if (session) await session.release();
  }
};
