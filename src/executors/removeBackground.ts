import type { RenderResult } from './render';
export function removeBackground(
  blob: Blob,
  onProgress?: (message: string) => void,
): Promise<RenderResult> {
  if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined')
    throw new Error(
      'Remove BG needs a browser with image-worker support. Try a recent Chrome, Edge, Firefox, or Safari.',
    );
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./background.worker.ts', import.meta.url), {
      type: 'module',
    });
    const timer = setTimeout(() => {
      worker.terminate();
      reject(new Error('Background removal took too long. Try a smaller image and run it again.'));
    }, 180000);
    const finish = () => {
      clearTimeout(timer);
      worker.terminate();
    };
    worker.onmessage = (e) => {
      if (e.data.progress) {
        onProgress?.(e.data.progress);
        return;
      }
      finish();
      if (e.data.ok) resolve(e.data.result);
      else reject(new Error(e.data.error));
    };
    worker.onerror = () => {
      finish();
      reject(new Error('Background removal could not start. Reload the page and try again.'));
    };
    worker.postMessage({ blob, modelUrl: new URL('/models/u2netp.onnx', location.origin).href });
  });
}
