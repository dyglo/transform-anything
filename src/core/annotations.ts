import type { AnnotationDocument, AnnotationElement, TransformObject } from './types';
import { pixelBounds, MAX_BLUR_PIXELS } from './regions';

export function validateAnnotations(
  value: unknown,
  object: TransformObject,
): asserts value is AnnotationDocument {
  const fail = () => {
    throw new Error(
      'Invalid annotations. Use schema version 1 or 2, up to 100 elements, valid styles and boxes inside the image; text labels require 1–500 characters.',
    );
  };
  if (!value || typeof value !== 'object') return fail();
  const doc = value as AnnotationDocument;
  if (Object.keys(doc).some((k) => !['version', 'elements'].includes(k))) return fail();
  if (
    !Number.isSafeInteger(object.metadata.width) ||
    !Number.isSafeInteger(object.metadata.height) ||
    object.metadata.width! < 1 ||
    object.metadata.height! < 1
  )
    return fail();
  if (
    ![1, 2].includes(doc.version) ||
    !Array.isArray(doc.elements) ||
    doc.elements.length < 1 ||
    doc.elements.length > 100
  )
    return fail();
  const ids = new Set<string>();
  let blurPixels = 0;
  for (const e of doc.elements) {
    if (
      e &&
      Object.keys(e).some(
        (k) =>
          ![
            'id',
            'kind',
            'x',
            'y',
            'width',
            'height',
            'color',
            'stroke',
            'opacity',
            'fontSize',
            'text',
            'flipX',
            'flipY',
            ...(doc.version === 2 && e.kind === 'blur' ? ['blurRadius'] : []),
          ].includes(k),
      )
    )
      return fail();
    if (
      !e ||
      typeof e !== 'object' ||
      typeof e.id !== 'string' ||
      !e.id ||
      e.id.length > 100 ||
      ids.has(e.id)
    )
      return fail();
    ids.add(e.id);
    if (
      ![
        'text',
        'arrow',
        'rectangle',
        'highlight',
        ...(doc.version === 2 ? ['blur', 'redact'] : []),
      ].includes(e.kind) ||
      !/^#[0-9a-f]{6}$/i.test(e.color)
    )
      return fail();
    if (
      ![e.x, e.y, e.width, e.height, e.stroke, e.opacity, e.fontSize].every(
        (n) => typeof n === 'number' && Number.isFinite(n),
      )
    )
      return fail();
    if (
      e.x < 0 ||
      e.y < 0 ||
      e.width < 1 ||
      e.height < 1 ||
      e.x + e.width > object.metadata.width! ||
      e.y + e.height > object.metadata.height!
    )
      return fail();
    if (
      e.stroke < 1 ||
      e.stroke > 100 ||
      e.fontSize < 1 ||
      e.fontSize > 512 ||
      e.opacity < 0.05 ||
      e.opacity > 1 ||
      (e.kind === 'highlight' && e.opacity > 0.8)
    )
      return fail();
    if (e.kind === 'redact' || e.kind === 'blur') {
      if (e.opacity !== 1) throw new Error('Blur and opaque redaction require full opacity.');
      if (e.kind === 'blur') {
        if (!Number.isSafeInteger(e.blurRadius) || e.blurRadius! < 1 || e.blurRadius! > 64)
          throw new Error('Blur radius must be a whole number from 1 to 64 source pixels.');
        const bounds = pixelBounds(e);
        blurPixels += bounds.width * bounds.height;
        if (blurPixels > MAX_BLUR_PIXELS)
          throw new Error(
            'Blur regions must total 4 megapixels or less. Resize first or use opaque redaction.',
          );
      }
    }
    if (
      typeof e.flipX !== 'boolean' ||
      typeof e.flipY !== 'boolean' ||
      typeof e.text !== 'string' ||
      e.text.length > 500 ||
      (e.kind === 'text' && !e.text.trim())
    )
      return fail();
  }
}

export function adjustAnnotation(
  e: AnnotationElement,
  mode: 'move' | 'resize',
  dx: number,
  dy: number,
  width: number,
  height: number,
): AnnotationElement {
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  return mode === 'move'
    ? { ...e, x: clamp(e.x + dx, 0, width - e.width), y: clamp(e.y + dy, 0, height - e.height) }
    : {
        ...e,
        width: clamp(e.width + dx, 1, width - e.x),
        height: clamp(e.height + dy, 1, height - e.y),
      };
}
