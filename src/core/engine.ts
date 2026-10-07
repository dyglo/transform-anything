import { TransformError } from './errors';
import { supportsInputs } from './registry';
import {
  type Executor,
  type ExecutionContext,
  type OperationRecord,
  type Parameters,
  type Session,
  type TransformObject,
  type TransformationDefinition,
} from './types';
export async function executeTransformation(
  input: TransformObject | readonly TransformObject[],
  operation: TransformationDefinition,
  parameters: Parameters,
  executors: Executor[],
  context?: ExecutionContext,
): Promise<{ objects: TransformObject[]; operation: OperationRecord }> {
  const objects = Array.isArray(input) ? [...input] : [input as TransformObject];
  if (!supportsInputs(operation, objects))
    throw new TransformError(
      'INCOMPATIBLE_INPUT',
      'This operation does not support the selected objects or input count.',
    );
  let snapshot: Parameters;
  try {
    snapshot = structuredClone(parameters);
    operation.validate(snapshot, objects);
  } catch (error) {
    throw new TransformError(
      'INVALID_PARAMETERS',
      error instanceof Error ? error.message : 'Invalid transformation parameters.',
      error,
    );
  }
  const executor = executors.find((e) => e.supports(operation.execution));
  if (!executor)
    throw new TransformError(
      'EXECUTOR_UNAVAILABLE',
      'This processing capability is not available yet.',
    );
  let outputs: TransformObject[];
  try {
    outputs = await executor.execute(objects, operation, structuredClone(snapshot), context);
  } catch (error) {
    throw new TransformError(
      'EXECUTION_FAILED',
      error instanceof Error ? error.message : 'Processing failed.',
      error,
    );
  }
  const inputIds = new Set(objects.map((o) => o.id));
  if (
    !Array.isArray(outputs) ||
    outputs.length < operation.outputs.min ||
    outputs.length > operation.outputs.max ||
    new Set(outputs.map((o) => o?.id)).size !== outputs.length ||
    Array.from(outputs).some(
      (o) =>
        !o ||
        typeof o.id !== 'string' ||
        !o.id ||
        inputIds.has(o.id) ||
        !operation.produces.includes(o.mimeType),
    )
  )
    throw new TransformError(
      'INVALID_OUTPUT',
      'The executor must return valid new objects with unique identities, supported output formats and the declared output count.',
    );
  return {
    objects: outputs,
    operation: {
      id: crypto.randomUUID(),
      inputIds: objects.map((o) => o.id),
      outputIds: outputs.map((o) => o.id),
      transformationId: operation.id,
      version: operation.version,
      parameters: snapshot,
      createdAt: Date.now(),
    },
  };
}
export function appendResult(
  session: Session,
  result: { objects: TransformObject[]; operation: OperationRecord },
): Session {
  const known = new Set(session.objects.map((o) => o.id));
  const ids = result.objects.map((o) => o.id);
  if (
    !ids.length ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => known.has(id)) ||
    !result.operation.inputIds.length ||
    new Set(result.operation.inputIds).size !== result.operation.inputIds.length ||
    result.operation.inputIds.some((id) => !known.has(id)) ||
    result.operation.outputIds.length !== ids.length ||
    result.operation.outputIds.some((id, i) => id !== ids[i]) ||
    session.operations.some((op) => op.id === result.operation.id)
  )
    throw new TransformError(
      'INVALID_OUTPUT',
      'Cannot add incomplete or conflicting transformation results to history.',
    );
  return {
    ...session,
    objects: [...session.objects, ...result.objects],
    operations: [...session.operations, result.operation],
    activeId: result.objects[0].id,
  };
}
