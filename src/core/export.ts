import { resolveBytes } from '../storage/objects';
import type { TransformObject } from './types';
export async function downloadObject(object: TransformObject) {
  const url = URL.createObjectURL(await resolveBytes(object.storage));
  const a = document.createElement('a');
  a.href = url;
  a.download = object.name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function copyObject(object: TransformObject) {
  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined')
    throw new Error('Clipboard image copy is unavailable here. Download the image instead.');
  // PNG is the interoperable clipboard format. Conversion stays local and preserves alpha.
  let blob = await resolveBytes(object.storage);
  if (blob.type !== 'image/png') {
    const { renderImage } = await import('../executors/render');
    blob = (
      await renderImage(
        { blob, operation: 'convert', parameters: { quality: 100 }, mime: 'image/png' },
        false,
      )
    ).blob;
  }
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
  } catch {
    throw new Error(
      'Clipboard permission was denied. Download the image or allow clipboard access.',
    );
  }
}
