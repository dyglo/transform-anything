import 'fake-indexeddb/auto';
import { beforeEach, describe, it, expect } from 'vitest';
import { clearStorage, resolveBytes, restoreSession, saveSession } from '../../src/storage/objects';
import { newSession, type TransformObject } from '../../src/core/types';
beforeEach(async () => {
  await clearStorage();
});
describe('temporary local storage', () => {
  it('recovers graph metadata and bytes with local references', async () => {
    const blob = new Blob(['original bytes'], { type: 'image/png' });
    const o: TransformObject = {
      id: 'a',
      type: 'image',
      name: 'a.png',
      size: blob.size,
      mimeType: blob.type,
      metadata: { width: 1, height: 1 },
      createdAt: Date.now(),
      storage: { kind: 'blob', blob },
      preview: { objectId: 'a' },
    };
    const s = { ...newSession(), objects: [o], activeId: 'a' };
    await saveSession(s);
    const saved = await restoreSession();
    expect(saved?.activeId).toBe('a');
    expect(saved?.objects[0].storage).toEqual({ kind: 'indexeddb', key: 'a' });
    expect(await (await resolveBytes(saved!.objects[0].storage)).text()).toBe('original bytes');
  });
  it('expires sessions and removes their bytes', async () => {
    await saveSession({ ...newSession(), expiresAt: Date.now() - 1 });
    expect(await restoreSession()).toBeNull();
    await expect(resolveBytes({ kind: 'indexeddb', key: 'missing' })).rejects.toThrow(
      'no longer available',
    );
  });
  it('clears the stored session', async () => {
    await saveSession(newSession());
    await clearStorage();
    expect(await restoreSession()).toBeNull();
  });
});
