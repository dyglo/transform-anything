import { useEffect, useState } from 'react';
import type { TransformObject } from '../core/types';
import { resolveBytes } from '../storage/objects';
export function useObjectUrl(object?: TransformObject) {
  const [state, setState] = useState<{ id: string; url: string } | null>(null);
  useEffect(() => {
    let disposed = false;
    let url: string | undefined;
    if (object)
      resolveBytes(object.storage)
        .then((blob) => {
          if (disposed) return;
          url = URL.createObjectURL(blob);
          setState({ id: object.id, url });
        })
        .catch(() => {
          if (!disposed) setState(null);
        });
    return () => {
      disposed = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [object]);
  return state?.id === object?.id ? state?.url : undefined;
}
