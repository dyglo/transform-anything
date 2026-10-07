import { type ImageMime, type OperationId, type Parameters } from '../core/types';
export interface RenderRequest {
  blob: Blob;
  operation: OperationId;
  parameters: Parameters;
  mime: ImageMime;
}
export interface RenderResult {
  blob: Blob;
  width: number;
  height: number;
}
export async function renderImage(req: RenderRequest, offscreen: boolean): Promise<RenderResult> {
  const bitmap = await createImageBitmap(req.blob, { imageOrientation: 'from-image' });
  let width = bitmap.width,
    height = bitmap.height;
  const p = req.parameters;
  if (req.operation === 'crop' || req.operation === 'resize') {
    width = Number(p.width);
    height = Number(p.height);
  }
  if (req.operation === 'rotate' && Number(p.angle) % 180 !== 0) {
    width = bitmap.height;
    height = bitmap.width;
  }
  try {
    const canvas = offscreen
      ? new OffscreenCanvas(width, height)
      : Object.assign(document.createElement('canvas'), { width, height });
    const ctx = canvas.getContext('2d') as
      CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
    if (!ctx) throw new Error('Your browser could not create an image canvas.');
    if (req.mime === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    if (req.operation === 'crop')
      ctx.drawImage(bitmap, Number(p.x), Number(p.y), width, height, 0, 0, width, height);
    else if (req.operation === 'rotate') {
      ctx.translate(width / 2, height / 2);
      ctx.rotate((Number(p.angle) * Math.PI) / 180);
      ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
    } else ctx.drawImage(bitmap, 0, 0, width, height);
    const quality = Number(p.quality ?? 90) / 100;
    const blob = offscreen
      ? await (canvas as OffscreenCanvas).convertToBlob({ type: req.mime, quality })
      : await new Promise<Blob>((resolve, reject) =>
          (canvas as HTMLCanvasElement).toBlob(
            (b) =>
              b
                ? resolve(b)
                : reject(new Error('Could not encode this image. Try smaller dimensions.')),
            req.mime,
            quality,
          ),
        );
    if (blob.type !== req.mime)
      throw new Error(
        `Your browser cannot export ${req.mime.split('/')[1].toUpperCase()}. Choose PNG or JPEG instead.`,
      );
    return { blob, width, height };
  } finally {
    bitmap.close();
  }
}
