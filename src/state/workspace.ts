import { create } from 'zustand';
import {
  newSession,
  type Parameters,
  type Session,
  type TransformationDefinition,
} from '../core/types';
import { appendResult, executeTransformation } from '../core/engine';
import { importImage, localExecutor } from '../executors/local';
import { clearStorage, restoreSession, saveSession } from '../storage/objects';
import { validateAnnotations } from '../core/annotations';
interface State {
  session: Session;
  ready: boolean;
  busy: boolean;
  progress: string | null;
  error: string | null;
  notice: string | null;
  init: () => Promise<void>;
  importFiles: (files: File[]) => Promise<void>;
  apply: (op: TransformationDefinition, p: Parameters) => Promise<void>;
  select: (id: string) => void;
  clear: () => Promise<void>;
  report: (error: string | null) => void;
}
let initPromise: Promise<void> | undefined;
let persistence: Promise<void> = Promise.resolve();
function persist(session: Session) {
  persistence = persistence
    .catch(() => {})
    .then(() => saveSession(session))
    .catch(() => {
      useWorkspace.setState({
        notice:
          'Local recovery is unavailable or storage is full. This session still works in this tab; download your outputs before leaving.',
      });
    });
  return persistence;
}
export const useWorkspace = create<State>((set, get) => ({
  session: newSession(),
  ready: false,
  busy: false,
  progress: null,
  error: null,
  notice: null,
  init: () => {
    if (!initPromise)
      initPromise = (async () => {
        try {
          const session = await restoreSession();
          if (session) {
            set({ session });
            for (const record of session.operations.filter(
              (r) => r.transformationId === 'annotate',
            )) {
              try {
                const input = session.objects.find((o) => o.id === record.inputIds[0]);
                if (!input || record.version !== 1)
                  throw new Error('Unsupported annotation record.');
                validateAnnotations(record.parameters.annotations, input);
              } catch {
                set({
                  notice:
                    'Some recovered annotation parameters are invalid or unsupported. Your images and graph are retained; select a source image to create a fresh annotation.',
                });
              }
            }
          }
        } catch {
          set({ notice: 'Local recovery is unavailable. Images will remain in this tab only.' });
        } finally {
          set({ ready: true });
        }
      })();
    return initPromise;
  },
  importFiles: async (files) => {
    if (!get().ready || get().busy) return;
    set({ busy: true, error: null, progress: null });
    const imported = [];
    const failures = [];
    for (const file of files) {
      try {
        imported.push(await importImage(file));
      } catch (e) {
        failures.push(e instanceof Error ? e.message : 'Import failed.');
      }
    }
    let session = get().session;
    if (session.expiresAt <= Date.now()) {
      await persistence;
      try {
        await clearStorage();
      } catch {
        set({ notice: 'Expired data could not be removed. Clear browser site data to remove it.' });
      }
      session = newSession();
    }
    if (imported.length) {
      session = {
        ...session,
        objects: [...session.objects, ...imported],
        activeId: imported[0].id,
      };
      set({ session });
      await persist(session);
    }
    set({ busy: false, error: failures.length ? failures.join(' ') : null });
  },
  apply: async (op, p) => {
    if (get().busy) return;
    const session = get().session;
    const active = session.objects.find((o) => o.id === session.activeId);
    if (!active) return;
    if (session.expiresAt <= Date.now()) {
      set({ error: 'This session has expired. Start a new session and import your image again.' });
      return;
    }
    set({ busy: true, error: null, progress: null });
    try {
      const result = await executeTransformation(active, op, p, [localExecutor], {
        onProgress: (progress) => set({ progress }),
      });
      const updated = appendResult(get().session, result);
      set({ session: updated });
      await persist(updated);
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Processing failed.' });
    } finally {
      set({ busy: false, progress: null });
    }
  },
  select: (id) => {
    if (get().busy) return;
    const session = get().session;
    if (!session.objects.some((o) => o.id === id)) return;
    const updated = { ...session, activeId: id };
    set({ session: updated, error: null });
    void persist(updated);
  },
  clear: async () => {
    if (get().busy) return;
    set({ busy: true });
    await persistence;
    try {
      await clearStorage();
      set({ notice: null });
    } catch {
      set({
        notice:
          'Could not clear browser storage. Use your browser’s site-data controls to remove stored images.',
      });
    }
    set({ session: newSession(), busy: false, error: null });
  },
  report: (error) => set({ error }),
}));
