import { TransformError } from './errors';
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
  object: TransformObject,
  operation: TransformationDefinition,
  parameters: Parameters,
  executors: Executor[],
  context?: ExecutionContext,
): Promise<{ objects: TransformObject[]; operation: OperationRecord }> {
  if (!operation.accepts.includes(object.mimeType))
    throw new TransformError(
      'INCOMPATIBLE_INPUT',
      'This operation does not support the selected object.',
    );
  let snapshot: Parameters;
  try {
    snapshot = structuredClone(parameters);
    operation.validate(snapshot, object);
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
  let output: TransformObject;
  try {
    output = await executor.execute(object, operation, structuredClone(snapshot), context);
  } catch (error) {
    throw new TransformError(
      'EXECUTION_FAILED',
      error instanceof Error ? error.message : 'Processing failed.',
      error,
    );
  }
  if (!operation.produces.includes(output.mimeType))
    throw new TransformError(
      'INVALID_OUTPUT',
      'The executor returned an unsupported output format.',
    );
  if (!output.id || output.id === object.id)
    throw new TransformError('INVALID_OUTPUT', 'The executor must create a new output object.');
  return {
    objects: [output],
    operation: {
      id: crypto.randomUUID(),
      inputIds: [object.id],
      outputIds: [output.id],
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
  return {
    ...session,
    objects: [...session.objects, ...result.objects],
    operations: [...session.operations, result.operation],
    activeId: result.objects[0].id,
  };
}
