import {
  IMAGE_MIMES,
  MAX_PIXELS,
  type Parameters,
  type TransformObject,
  type TransformationDefinition,
} from './types';
import { validateAnnotations } from './annotations';
function integer(p: Parameters, key: string, min = 1) {
  const n = Number(p[key]);
  if (!Number.isSafeInteger(n) || n < min)
    throw new Error(`${key} must be a whole number of at least ${min}.`);
  return n;
}
function dimensions(p: Parameters) {
  const w = integer(p, 'width'),
    h = integer(p, 'height');
  if (w * h > MAX_PIXELS || w > 16384 || h > 16384)
    throw new Error('Use dimensions up to 16,384px and 40 megapixels.');
}
function format(p: Parameters) {
  if (!IMAGE_MIMES.includes(p.format as (typeof IMAGE_MIMES)[number]))
    throw new Error('Choose PNG, JPEG, or WebP.');
  const q = Number(p.quality);
  if (!Number.isFinite(q) || q < 1 || q > 100)
    throw new Error('Quality must be between 1 and 100.');
}
const common = {
  family: 'Image Prep',
  version: 1,
  accepts: IMAGE_MIMES,
  produces: IMAGE_MIMES,
  execution: 'local-image' as const,
  capabilities: { batch: true, preview: true, nonDestructive: true },
};
export const registry: TransformationDefinition[] = [
  {
    ...common,
    id: 'crop',
    name: 'Crop',
    defaults: (o) => ({ x: 0, y: 0, width: o.metadata.width!, height: o.metadata.height! }),
    validate: (p, o) => {
      dimensions(p);
      const x = integer(p, 'x', 0),
        y = integer(p, 'y', 0);
      if (x + Number(p.width) > o.metadata.width! || y + Number(p.height) > o.metadata.height!)
        throw new Error('The crop must fit inside the image.');
    },
  },
  {
    ...common,
    id: 'resize',
    name: 'Resize',
    defaults: (o) => ({ width: o.metadata.width!, height: o.metadata.height!, lock: true }),
    validate: dimensions,
  },
  {
    ...common,
    id: 'rotate',
    name: 'Rotate',
    defaults: () => ({ angle: 90 }),
    validate: (p) => {
      if (![90, 180, 270].includes(Number(p.angle)))
        throw new Error('Choose a 90°, 180°, or 270° rotation.');
    },
  },
  {
    ...common,
    id: 'convert',
    name: 'Convert',
    defaults: (o) => ({ format: o.mimeType, quality: 90 }),
    validate: format,
  },
  {
    ...common,
    id: 'compress',
    name: 'Optimize',
    accepts: ['image/jpeg', 'image/webp'],
    defaults: (o) => ({ format: o.mimeType, quality: 80 }),
    validate: format,
  },
  {
    ...common,
    id: 'remove-bg',
    name: 'Remove BG',
    produces: ['image/png'],
    execution: 'local-background',
    defaults: () => ({}),
    validate: () => {},
  },
  {
    ...common,
    id: 'annotate',
    name: 'Annotate',
    family: 'Screenshot Studio',
    produces: ['image/png'],
    capabilities: { batch: false, preview: true, nonDestructive: true },
    defaults: () => ({ annotations: { version: 1, elements: [] } }),
    validate: (p, o) => validateAnnotations(p.annotations, o),
  },
];
export function compatible(object: TransformObject) {
  return registry.filter((op) => op.accepts.includes(object.mimeType));
}
