export type TransformErrorCode =
  | 'INCOMPATIBLE_INPUT'
  | 'INVALID_PARAMETERS'
  | 'EXECUTOR_UNAVAILABLE'
  | 'EXECUTION_FAILED'
  | 'INVALID_OUTPUT';

export class TransformError extends Error {
  constructor(
    public readonly code: TransformErrorCode,
    message: string,
    cause?: unknown,
  ) {
    super(message, { cause });
    this.name = 'TransformError';
  }
}
