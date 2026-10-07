export const IMAGE_MIMES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export type ImageMime = (typeof IMAGE_MIMES)[number];
export type StorageReference =
  | { kind: 'blob'; blob: Blob }
  | { kind: 'indexeddb'; key: string }
  | { kind: 'r2'; key: string; expiresAt: number }
  | { kind: 'remote'; objectId: string; executorId: string };
export interface TransformObject {
  id: string;
  type: 'image' | 'text' | 'url' | 'pdf' | 'data' | 'audio' | 'video' | 'archive' | 'document';
  mimeType: string;
  name: string;
  size: number;
  createdAt: number;
  metadata: { width?: number; height?: number; [key: string]: unknown };
  storage: StorageReference;
  preview: { objectId: string };
}
export type OperationId =
  'crop' | 'resize' | 'rotate' | 'convert' | 'compress' | 'remove-bg' | 'annotate';
export interface AnnotationElement {
  id: string;
  kind: 'text' | 'arrow' | 'rectangle' | 'highlight' | 'blur' | 'redact';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  stroke: number;
  opacity: number;
  fontSize: number;
  text: string;
  flipX: boolean;
  flipY: boolean;
  blurRadius?: number;
}
export interface AnnotationDocument {
  version: 1 | 2;
  elements: AnnotationElement[];
}
export type Parameters = Record<string, number | string | boolean | AnnotationDocument>;
export interface OperationRecord {
  id: string;
  inputIds: string[];
  outputIds: string[];
  transformationId: string;
  version: number;
  parameters: Parameters;
  createdAt: number;
}
export interface Session {
  id: string;
  createdAt: number;
  expiresAt: number;
  objects: TransformObject[];
  operations: OperationRecord[];
  activeId: string | null;
}
export type ExecutionRequirement =
  | 'local-image'
  | 'local-background'
  | 'cloud-lightweight'
  | 'cloud-job'
  | 'browser-capture'
  | 'external';
export interface ExecutionContext {
  onProgress?: (message: string) => void;
}
export interface TransformationDefinition {
  id: OperationId;
  name: string;
  family: string;
  version: number;
  accepts: readonly string[];
  produces: readonly string[];
  execution: ExecutionRequirement;
  capabilities: { batch: boolean; preview: boolean; nonDestructive: boolean };
  defaults: (object: TransformObject) => Parameters;
  validate: (parameters: Parameters, object: TransformObject) => void;
}
export interface Executor {
  supports: (requirement: ExecutionRequirement) => boolean;
  execute: (
    object: TransformObject,
    operation: TransformationDefinition,
    parameters: Parameters,
    context?: ExecutionContext,
  ) => Promise<TransformObject>;
}
export const SESSION_TTL = 24 * 60 * 60 * 1000;
export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_PIXELS = 40_000_000;
export function newSession(): Session {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    createdAt: now,
    expiresAt: now + SESSION_TTL,
    objects: [],
    operations: [],
    activeId: null,
  };
}
