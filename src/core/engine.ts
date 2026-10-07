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
    throw new Error('This operation does not support the selected object.');
  operation.validate(parameters, object);
  const executor = executors.find((e) => e.supports(operation.execution));
  if (!executor) throw new Error('This processing capability is not available yet.');
  const output = await executor.execute(object, operation, parameters, context);
  if (!operation.produces.includes(output.mimeType))
    throw new Error('The executor returned an unsupported output format.');
  return {
    objects: [output],
    operation: {
      id: crypto.randomUUID(),
      inputIds: [object.id],
      outputIds: [output.id],
      transformationId: operation.id,
      version: operation.version,
      parameters: structuredClone(parameters),
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
