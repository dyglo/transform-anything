import { type Session, type StorageReference, SESSION_TTL } from '../core/types';
const DB_NAME = 'transform-local';
let database: Promise<IDBDatabase> | undefined;
function open(): Promise<IDBDatabase> {
  if (!database)
    database = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore('session');
        req.result.createObjectStore('bytes');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        database = undefined;
        reject(req.error);
      };
    });
  return database;
}
function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
function complete(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error('Local storage transaction aborted.'));
    tx.onerror = () => reject(tx.error);
  });
}
export async function resolveBytes(ref: StorageReference): Promise<Blob> {
  if (ref.kind === 'blob') return ref.blob;
  if (ref.kind === 'indexeddb') {
    const db = await open();
    const blob = await request(db.transaction('bytes').objectStore('bytes').get(ref.key));
    if (!(blob instanceof Blob))
      throw new Error('This image is no longer available. Import it again.');
    return blob;
  }
  throw new Error('Cloud objects are not supported in this local release.');
}
export async function saveSession(session: Session): Promise<void> {
  const db = await open();
  const tx = db.transaction(['session', 'bytes'], 'readwrite');
  const done = complete(tx);
  try {
    const objects = session.objects.map((o) => {
      if (o.storage.kind === 'blob') {
        tx.objectStore('bytes').put(o.storage.blob, o.id);
        return { ...o, storage: { kind: 'indexeddb' as const, key: o.id } };
      }
      return o;
    });
    tx.objectStore('session').put({ ...session, objects }, 'current');
  } catch (e) {
    tx.abort();
    await done.catch(() => {});
    throw e;
  }
  await done;
}
export async function clearStorage(): Promise<void> {
  const db = await open();
  const tx = db.transaction(['session', 'bytes'], 'readwrite');
  const done = complete(tx);
  tx.objectStore('session').clear();
  tx.objectStore('bytes').clear();
  await done;
}
export async function restoreSession(): Promise<Session | null> {
  const db = await open();
  const saved = await request<Session | undefined>(
    db.transaction('session').objectStore('session').get('current'),
  );
  if (!saved) return null;
  if (saved.expiresAt <= Date.now() || Date.now() - saved.createdAt >= SESSION_TTL) {
    await clearStorage();
    return null;
  }
  return saved;
}
