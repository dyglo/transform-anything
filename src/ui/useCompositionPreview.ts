import { useEffect, useState } from 'react';
import { executeTransformation } from '../core/engine';
import { localExecutor } from '../executors/local';
import { resolveBytes } from '../storage/objects';
import type { Parameters, TransformationDefinition, TransformObject } from '../core/types';
export function useCompositionPreview(
  inputs: readonly TransformObject[],
  operation: TransformationDefinition,
  parameters: Parameters,
  enabled: boolean,
) {
  const [preview, setPreview] = useState<{
    url?: string;
    error?: string;
    pending: boolean;
    width?: number;
    height?: number;
  }>({
    pending: false,
  });
  useEffect(() => {
    if (!enabled) {
      setPreview({ pending: false });
      return;
    }
    const controller = new AbortController();
    let url: string | undefined;
    setPreview({ pending: true });
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const result = await executeTransformation(
            inputs,
            operation,
            parameters,
            [localExecutor],
            { signal: controller.signal },
          );
          const blob = await resolveBytes(result.objects[0].storage);
          if (controller.signal.aborted) return;
          url = URL.createObjectURL(blob);
          setPreview({
            url,
            pending: false,
            width: result.objects[0].metadata.width,
            height: result.objects[0].metadata.height,
          });
        } catch (error) {
          if (!controller.signal.aborted)
            setPreview({
              pending: false,
              error: error instanceof Error ? error.message : 'Preview failed.',
            });
        }
      })();
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timer);
      if (url) URL.revokeObjectURL(url);
    };
  }, [inputs, operation, parameters, enabled]);
  return preview;
}
