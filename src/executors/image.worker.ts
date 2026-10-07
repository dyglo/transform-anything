/// <reference lib="webworker" />
import { renderImage, type RenderRequest } from './render';
self.onmessage = async (event: MessageEvent<RenderRequest>) => {
  try {
    self.postMessage({ ok: true, result: await renderImage(event.data, true) });
  } catch (e) {
    self.postMessage({
      ok: false,
      error: e instanceof Error ? e.message : 'Image processing failed.',
    });
  }
};
