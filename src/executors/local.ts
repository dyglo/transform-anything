import {
  IMAGE_MIMES,
  MAX_FILE_BYTES,
  MAX_PIXELS,
  type Executor,
  type ImageMime,
  type TransformObject,
  type AnnotationDocument,
} from '../core/types';
import { resolveBytes } from '../storage/objects';
import { detectImageMime } from '../core/detection';
import { renderImage, type RenderRequest, type RenderResult } from './render';
export async function importImage(file: File): Promise<TransformObject> {
  if (file.size > MAX_FILE_BYTES)
    throw new Error(`${file.name}: images must be 25 MiB or smaller.`);
  const mime = detectImageMime(new Uint8Array(await file.slice(0, 12).arrayBuffer()));
  if (!mime) {
    if (IMAGE_MIMES.includes(file.type as ImageMime))
      throw new Error(`${file.name}: this image could not be read. It may be damaged.`);
    throw new Error(
      `${file.name}: this release supports PNG, JPEG, and WebP images. Other families are coming later.`,
    );
  }
  const bytes = file.slice(0, file.size, mime);
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(bytes, { imageOrientation: 'from-image' });
  } catch {
    throw new Error(`${file.name}: this image could not be read. It may be damaged.`);
  }
  const width = bitmap.width,
    height = bitmap.height;
  bitmap.close();
  if (width * height > MAX_PIXELS || width > 16384 || height > 16384)
    throw new Error(`${file.name}: use an image under 40 megapixels with sides up to 16,384px.`);
  const id = crypto.randomUUID();
  return {
    id,
    type: 'image',
    mimeType: mime,
    name: file.name,
    size: file.size,
    createdAt: Date.now(),
    metadata: { width, height },
    storage: { kind: 'blob', blob: bytes },
    preview: { objectId: id },
  };
}
async function process(req: RenderRequest): Promise<RenderResult> {
  if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined')
    return renderImage(req, false);
  let worker: Worker;
  try {
    worker = new Worker(new URL('./image.worker.ts', import.meta.url), { type: 'module' });
  } catch {
    return renderImage(req, false);
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      worker.terminate();
      reject(new Error('Processing timed out. Try a smaller image.'));
    }, 60000);
    const finish = () => {
      clearTimeout(timer);
      worker.terminate();
    };
    worker.onmessage = (e) => {
      finish();
      if (e.data.ok) resolve(e.data.result);
      else reject(new Error(e.data.error));
    };
    worker.onerror = () => {
      finish();
      renderImage(req, false).then(resolve, reject);
    };
    worker.postMessage(req);
  });
}
export const localExecutor: Executor = {
  supports: (req) => req === 'local-image' || req === 'local-background',
  async execute(object, operation, parameters, context) {
    const blob = await resolveBytes(object.storage);
    const mime = (
      operation.id === 'remove-bg' || operation.id === 'annotate'
        ? 'image/png'
        : (parameters.format ?? object.mimeType)
    ) as ImageMime;
    const result =
      operation.id === 'annotate'
        ? await (
            await import('./annotations')
          ).renderAnnotations(blob, parameters.annotations as AnnotationDocument)
        : operation.id === 'remove-bg'
          ? await (await import('./removeBackground')).removeBackground(blob, context?.onProgress)
          : await process({ blob, operation: operation.id, parameters, mime });
    const id = crypto.randomUUID();
    const ext = mime === 'image/jpeg' ? 'jpg' : mime.split('/')[1];
    return {
      id,
      type: 'image',
      mimeType: result.blob.type,
      name: `${object.name.replace(/\.[^.]+$/, '')}-${operation.id}.${ext}`,
      size: result.blob.size,
      createdAt: Date.now(),
      metadata: { width: result.width, height: result.height },
      storage: { kind: 'blob', blob: result.blob },
      preview: { objectId: id },
    };
  },
};
