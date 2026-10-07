import type { Parameters, TransformObject, ExecutionContext } from '../core/types';
import { compositionPlan } from '../core/composition';
import { resolveBytes } from '../storage/objects';
export async function renderComposition(
  objects: readonly TransformObject[],
  p: Parameters,
  frame: boolean,
  context?: ExecutionContext,
) {
  const plan = compositionPlan(objects, p, frame);
  if (context?.signal?.aborted) throw new Error('Preview cancelled.');
  const canvas = Object.assign(document.createElement('canvas'), {
    width: plan.width,
    height: plan.height,
  });
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create a composition canvas. Try smaller images.');
  const check = () => {
    if (context?.signal?.aborted) throw new Error('Preview cancelled.');
  };
  try {
    if (plan.background !== 'transparent') {
      ctx.fillStyle = plan.background;
      ctx.fillRect(0, 0, plan.width, plan.height);
    }
    for (let i = 0; i < objects.length; i++) {
      check();
      context?.onProgress?.(`Composing image ${i + 1} of ${objects.length}…`);
      const blob = await resolveBytes(objects[i].storage);
      check();
      const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
      try {
        check();
        const box = plan.placements[i];
        if (
          bitmap.width !== objects[i].metadata.width ||
          bitmap.height !== objects[i].metadata.height
        )
          throw new Error('An image no longer matches its saved dimensions. Import it again.');
        ctx.save();
        try {
          if (frame && plan.radius) {
            ctx.beginPath();
            ctx.roundRect(box.x, box.y, box.width, box.height, plan.radius);
            ctx.clip();
          }
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(bitmap, box.x, box.y, box.width, box.height);
        } finally {
          ctx.restore();
        }
        if (frame && plan.border) {
          ctx.strokeStyle = plan.borderColor;
          ctx.lineWidth = plan.border;
          ctx.beginPath();
          ctx.roundRect(
            box.x - plan.border / 2,
            box.y - plan.border / 2,
            box.width + plan.border,
            box.height + plan.border,
            plan.radius + plan.border / 2,
          );
          ctx.stroke();
        }
      } finally {
        bitmap.close();
      }
    }
    check();
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) =>
          b ? resolve(b) : reject(new Error('Composition encoding failed. Try smaller images.')),
        'image/png',
      ),
    );
    check();
    if (blob.type !== 'image/png') throw new Error('PNG composition encoding is unavailable.');
    return { blob, width: plan.width, height: plan.height };
  } finally {
    canvas.width = canvas.height = 0;
  }
}
