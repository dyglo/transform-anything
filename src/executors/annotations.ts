import type { AnnotationDocument } from '../core/types';
import { boxBlur } from './regionPixels';
import { pixelBounds } from '../core/regions';
import { validateAnnotations } from '../core/annotations';

// One source-pixel renderer for the transparent preview layer and committed PNG.
export function drawAnnotations(ctx: CanvasRenderingContext2D, doc: AnnotationDocument) {
  for (const e of doc.elements) {
    ctx.save();
    try {
      if (e.kind === 'redact' || e.kind === 'blur') {
        const b = pixelBounds(e);
        if (e.kind === 'redact') {
          // Integer bounds and full opacity replace alpha and RGB, including
          // fractional edges. No sensitive source pixel survives in this region.
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = e.color;
          ctx.clearRect(b.x, b.y, b.width, b.height);
          ctx.fillRect(b.x, b.y, b.width, b.height);
        } else {
          const pixels = ctx.getImageData(b.x, b.y, b.width, b.height);
          pixels.data.set(boxBlur(pixels.data, b.width, b.height, e.blurRadius!));
          ctx.putImageData(pixels, b.x, b.y);
        }
        continue;
      }
      ctx.globalAlpha = e.opacity;
      ctx.strokeStyle = ctx.fillStyle = e.color;
      ctx.lineWidth = e.stroke;
      ctx.lineJoin = ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.rect(e.x, e.y, e.width, e.height);
      ctx.clip();
      if (e.kind === 'highlight') ctx.fillRect(e.x, e.y, e.width, e.height);
      else if (e.kind === 'rectangle') {
        const inset = Math.min(e.stroke / 2, e.width / 2, e.height / 2);
        ctx.strokeRect(e.x + inset, e.y + inset, e.width - inset * 2, e.height - inset * 2);
      } else if (e.kind === 'arrow') {
        const pad = Math.min(Math.max(e.stroke, 6), e.width / 2, e.height / 2);
        const x1 = e.x + (e.flipX ? e.width - pad : pad),
          y1 = e.y + (e.flipY ? e.height - pad : pad);
        const x2 = e.x + (e.flipX ? pad : e.width - pad),
          y2 = e.y + (e.flipY ? pad : e.height - pad);
        const angle = Math.atan2(y2 - y1, x2 - x1),
          head = Math.min(Math.max(8, e.stroke * 3), Math.hypot(x2 - x1, y2 - y1) / 2);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(
          x2 - head * Math.cos(angle - Math.PI / 6),
          y2 - head * Math.sin(angle - Math.PI / 6),
        );
        ctx.lineTo(
          x2 - head * Math.cos(angle + Math.PI / 6),
          y2 - head * Math.sin(angle + Math.PI / 6),
        );
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.font = `${e.fontSize}px Arial, sans-serif`;
        ctx.textBaseline = 'top';
        let y = e.y;
        for (const paragraph of e.text.split('\n')) {
          let line = '';
          for (const char of paragraph) {
            if (line && ctx.measureText(line + char).width > e.width) {
              ctx.fillText(line, e.x, y);
              y += e.fontSize * 1.2;
              line = '';
            }
            line += char;
          }
          ctx.fillText(line, e.x, y);
          y += e.fontSize * 1.2;
        }
      }
    } finally {
      ctx.restore();
    }
  }
}

export async function renderAnnotations(blob: Blob, doc: AnnotationDocument) {
  const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
  try {
    const canvas = Object.assign(document.createElement('canvas'), {
      width: bitmap.width,
      height: bitmap.height,
    });
    validateAnnotations(doc, {
      metadata: { width: bitmap.width, height: bitmap.height },
    } as Parameters<typeof validateAnnotations>[1]);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create the annotation canvas. Try a smaller image.');
    ctx.drawImage(bitmap, 0, 0);
    drawAnnotations(ctx, doc);
    const output = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) =>
          b ? resolve(b) : reject(new Error('Annotation encoding failed. Try a smaller image.')),
        'image/png',
      ),
    );
    if (output.type !== 'image/png') throw new Error('PNG annotation encoding is unavailable.');
    return { blob: output, width: bitmap.width, height: bitmap.height };
  } finally {
    bitmap.close();
  }
}
