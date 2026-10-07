import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
  type PointerEvent,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import type { AnnotationElement, AnnotationDocument, TransformObject } from '../core/types';
import { adjustAnnotation } from '../core/annotations';
import { drawAnnotations } from '../executors/annotations';

type Draft = {
  elements: AnnotationElement[];
  past: AnnotationElement[][];
  future: AnnotationElement[][];
  selected: string | null;
};
const empty = (): Draft => ({ elements: [], past: [], future: [], selected: null });
const kinds = ['text', 'arrow', 'rectangle', 'highlight'] as const;
export default function AnnotationEditor({
  object,
  image,
  visible,
  disabled,
  onApply,
  onCancel,
}: {
  object: TransformObject;
  image: RefObject<HTMLImageElement | null>;
  visible: boolean;
  disabled: boolean;
  onApply: (doc: AnnotationDocument) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const draft = drafts[object.id] ?? empty();
  const [tool, setTool] = useState<AnnotationElement['kind'] | 'select'>('select');
  const [bounds, setBounds] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const gesture = useRef<{
    pointer: number;
    sourceId: string;
    before: AnnotationElement[];
    element: AnnotationElement;
    mode: 'move' | 'resize' | 'create';
    x: number;
    y: number;
  } | null>(null);
  const width = object.metadata.width!,
    height = object.metadata.height!;
  const selected = draft.elements.find((e) => e.id === draft.selected);
  const pending = Object.values(drafts).some((d) => d.elements.length);
  function update(fn: (d: Draft) => Draft, id = object.id) {
    setDrafts((all) => ({ ...all, [id]: fn(all[id] ?? empty()) }));
  }
  function commit(elements: AnnotationElement[], selectedId = draft.selected) {
    update((d) => ({
      elements,
      selected: selectedId,
      past: [...d.past.slice(-49), d.elements],
      future: [],
    }));
  }
  function edit(patch: Partial<AnnotationElement>) {
    if (selected)
      commit(draft.elements.map((e) => (e.id === selected.id ? { ...e, ...patch } : e)));
  }
  function undo(redo = false) {
    update((d) => {
      const stack = redo ? d.future : d.past;
      if (!stack.length) return d;
      return {
        elements: stack[stack.length - 1],
        selected: null,
        past: redo ? [...d.past, d.elements] : d.past.slice(0, -1),
        future: redo ? d.future.slice(0, -1) : [...d.future, d.elements],
      };
    });
  }
  function make(
    kind: AnnotationElement['kind'],
    x = width * 0.1,
    y = height * 0.1,
  ): AnnotationElement {
    return {
      id: crypto.randomUUID(),
      kind,
      x,
      y,
      width: Math.max(1, Math.min(width * 0.35, width - x)),
      height: Math.max(1, Math.min(height * 0.2, height - y)),
      color: kind === 'highlight' ? '#ffd400' : '#e53935',
      stroke: 4,
      opacity: kind === 'highlight' ? 0.35 : 1,
      fontSize: Math.min(32, height),
      text: kind === 'text' ? 'Label' : '',
      flipX: false,
      flipY: false,
    };
  }
  useEffect(() => {
    if (!pending) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [pending]);
  // Pointer capture ends when the source or editor surface changes.
  useEffect(() => {
    gesture.current = null;
  }, [object.id, visible]);
  useLayoutEffect(() => {
    if (!visible) return;
    const img = image.current;
    if (!img) return;
    const measure = () => {
      const b = img.getBoundingClientRect();
      setBounds({ left: img.offsetLeft, top: img.offsetTop, width: b.width, height: b.height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(img);
    img.addEventListener('load', measure);
    return () => {
      observer.disconnect();
      img.removeEventListener('load', measure);
    };
  }, [image, visible, object.id]);
  useLayoutEffect(() => {
    if (!visible || !canvas.current) return;
    const ctx = canvas.current.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    drawAnnotations(ctx, { version: 1, elements: draft.elements });
  }, [draft.elements, visible, width, height, bounds]);
  function point(event: PointerEvent) {
    const b = image.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(width - 1, ((event.clientX - b.left) * width) / b.width)),
      y: Math.max(0, Math.min(height - 1, ((event.clientY - b.top) * height) / b.height)),
    };
  }
  function begin(
    event: PointerEvent,
    e?: AnnotationElement,
    mode: 'move' | 'resize' | 'create' = 'move',
  ) {
    if (disabled || !event.isPrimary || event.button !== 0 || gesture.current) return;
    if (!e && tool === 'select') {
      update((d) => ({ ...d, selected: null }));
      return;
    }
    if (!e && draft.elements.length >= 100) return;
    event.preventDefault();
    event.stopPropagation();
    const p = point(event);
    const element = e ?? {
      ...make(tool as AnnotationElement['kind'], p.x, p.y),
      width: 1,
      height: 1,
    };
    gesture.current = {
      pointer: event.pointerId,
      sourceId: object.id,
      before: draft.elements,
      element,
      mode: e ? mode : 'create',
      ...p,
    };
    update((d) => ({
      ...d,
      selected: element.id,
      elements: e ? d.elements : [...d.elements, element],
    }));
    overlay.current?.setPointerCapture(event.pointerId);
  }
  function move(event: PointerEvent) {
    const g = gesture.current;
    if (!g || disabled || g.pointer !== event.pointerId) return;
    const p = point(event),
      dx = p.x - g.x,
      dy = p.y - g.y;
    const next =
      g.mode === 'create'
        ? {
            ...g.element,
            x: Math.min(p.x, g.x),
            y: Math.min(p.y, g.y),
            width: Math.max(1, Math.abs(dx)),
            height: Math.max(1, Math.abs(dy)),
            flipX: dx < 0,
            flipY: dy < 0,
          }
        : adjustAnnotation(g.element, g.mode, dx, dy, width, height);
    update((d) => ({ ...d, elements: d.elements.map((e) => (e.id === next.id ? next : e)) }));
  }
  function end(event: PointerEvent, cancel = false) {
    const g = gesture.current;
    if (!g || g.pointer !== event.pointerId) return;
    gesture.current = null;
    update(
      (d) =>
        cancel
          ? { ...d, elements: g.before }
          : { ...d, past: [...d.past.slice(-49), g.before], future: [] },
      g.sourceId,
    );
    if (overlay.current?.hasPointerCapture(event.pointerId))
      overlay.current.releasePointerCapture(event.pointerId);
    if (g.mode === 'create') setTool('select');
  }
  function key(event: KeyboardEvent, e: AnnotationElement, mode: 'move' | 'resize') {
    if (disabled) return;
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      commit(
        draft.elements.filter((a) => a.id !== e.id),
        null,
      );
      return;
    }
    const delta = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[
      event.key
    ];
    if (!delta) return;
    event.preventDefault();
    const step = event.shiftKey ? 10 : 1;
    commit(
      draft.elements.map((a) =>
        a.id === e.id
          ? adjustAnnotation(e, mode, delta[0] * step, delta[1] * step, width, height)
          : a,
      ),
      e.id,
    );
  }
  const otherDrafts = Object.entries(drafts).filter(
    ([id, d]) => id !== object.id && d.elements.length,
  ).length;
  const previewPanel = image.current?.closest('.preview-panel');
  if (!visible)
    return pending && previewPanel
      ? createPortal(
          <p className="annotation-draft-notice" role="status">
            Annotation drafts retained in this tab. Return to Annotate on their source images to
            resume. Apply before refreshing.
          </p>,
          previewPanel,
        )
      : null;
  return (
    <>
      {bounds && image.current?.parentElement
        ? createPortal(
            <div
              ref={overlay}
              className="annotation-overlay"
              style={bounds}
              onPointerDown={(e) => begin(e)}
              onPointerMove={move}
              onPointerUp={(e) => end(e)}
              onPointerCancel={(e) => end(e, true)}
              onLostPointerCapture={(e) => end(e, true)}
            >
              <canvas ref={canvas} width={width} height={height} aria-hidden="true" />
              {draft.elements.map((e, i) => (
                <div
                  key={e.id}
                  className={`annotation-box ${e.id === draft.selected ? 'selected' : ''}`}
                  style={{
                    left: `${(e.x / width) * 100}%`,
                    top: `${(e.y / height) * 100}%`,
                    width: `${(e.width / width) * 100}%`,
                    height: `${(e.height / height) * 100}%`,
                  }}
                >
                  <button
                    type="button"
                    className="annotation-move"
                    aria-label={`Move ${e.kind} ${i + 1}`}
                    disabled={disabled}
                    onFocus={() => update((d) => ({ ...d, selected: e.id }))}
                    onPointerDown={(ev) => begin(ev, e)}
                    onKeyDown={(ev) => key(ev, e, 'move')}
                  />
                  {e.id === draft.selected ? (
                    <button
                      type="button"
                      className="annotation-resize"
                      aria-label="Resize annotation"
                      disabled={disabled}
                      onPointerDown={(ev) => begin(ev, e, 'resize')}
                      onKeyDown={(ev) => key(ev, e, 'resize')}
                    />
                  ) : null}
                </div>
              ))}
            </div>,
            image.current.parentElement,
          )
        : null}
      <aside className="properties annotation-properties" aria-label="Annotation properties">
        <span className="panel-label">ANNOTATE · DRAFT</span>
        <p className="field-hint">
          Draw on the image or add an element below. Changes stay in this tab until Apply. Arrow
          keys move/resize 1px; Shift moves 10px. Text wraps and clips to its box.
        </p>
        {otherDrafts ? <p role="status">{otherDrafts} other image draft(s) retained.</p> : null}
        <fieldset disabled={disabled}>
          <label className="field">
            <span>Drawing tool</span>
            <select
              aria-label="Drawing tool"
              value={tool}
              onChange={(e) => setTool(e.target.value as typeof tool)}
            >
              <option value="select">Select / move</option>
              {kinds.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
          <div className="annotation-tools">
            {kinds.map((k) => (
              <button
                className="button button-light"
                key={k}
                disabled={draft.elements.length >= 100}
                onClick={() => {
                  const e = make(k);
                  commit([...draft.elements, e], e.id);
                  setTool('select');
                }}
              >
                Add {k}
              </button>
            ))}
          </div>
          <div className="annotation-tools">
            <button
              className="button button-light"
              disabled={!draft.past.length}
              onClick={() => undo()}
            >
              Undo draft
            </button>
            <button
              className="button button-light"
              disabled={!draft.future.length}
              onClick={() => undo(true)}
            >
              Redo draft
            </button>
          </div>
          <label className="field">
            <span>Selected element</span>
            <select
              aria-label="Selected element"
              value={draft.selected ?? ''}
              onChange={(e) => update((d) => ({ ...d, selected: e.target.value || null }))}
            >
              <option value="">None</option>
              {draft.elements.map((e, i) => (
                <option key={e.id} value={e.id}>
                  {i + 1}. {e.kind}
                </option>
              ))}
            </select>
          </label>
          {selected ? (
            <>
              {(['x', 'y', 'width', 'height', 'stroke', 'fontSize', 'opacity'] as const)
                .filter((k) => k !== 'fontSize' || selected.kind === 'text')
                .filter((k) => k !== 'stroke' || ['arrow', 'rectangle'].includes(selected.kind))
                .map((k) => (
                  <label className="field" key={k}>
                    <span>
                      {
                        {
                          x: 'Left',
                          y: 'Top',
                          width: 'Width',
                          height: 'Height',
                          stroke: 'Stroke width',
                          fontSize: 'Text size',
                          opacity: 'Opacity',
                        }[k]
                      }
                    </span>
                    <input
                      aria-label={`Annotation ${k}`}
                      type="number"
                      step={k === 'opacity' ? '0.05' : '1'}
                      value={selected[k]}
                      onChange={(e) => edit({ [k]: Number(e.target.value) })}
                    />
                  </label>
                ))}
              <label className="field">
                <span>Color</span>
                <input
                  aria-label="Annotation color"
                  type="color"
                  value={selected.color}
                  onChange={(e) => edit({ color: e.target.value })}
                />
              </label>
              {selected.kind === 'text' ? (
                <label className="field">
                  <span>Text content</span>
                  <textarea
                    aria-label="Text content"
                    maxLength={500}
                    value={selected.text}
                    onChange={(e) => edit({ text: e.target.value })}
                  />
                </label>
              ) : null}
              {selected.kind === 'arrow' ? (
                <div className="annotation-tools">
                  <button
                    className="button button-light"
                    onClick={() => edit({ flipX: !selected.flipX })}
                  >
                    Flip arrow horizontally
                  </button>
                  <button
                    className="button button-light"
                    onClick={() => edit({ flipY: !selected.flipY })}
                  >
                    Flip arrow vertically
                  </button>
                </div>
              ) : null}
              <button
                className="button button-light"
                onClick={() =>
                  commit(
                    draft.elements.filter((e) => e.id !== selected.id),
                    null,
                  )
                }
              >
                Delete element
              </button>
            </>
          ) : null}
          <button
            className="button apply-button"
            disabled={!draft.elements.length}
            onClick={async () => {
              const id = object.id;
              if (await onApply({ version: 1, elements: draft.elements }))
                update(() => empty(), id);
            }}
          >
            {disabled ? 'Transforming…' : 'Apply annotations'}
          </button>
          <button
            className="button button-light"
            onClick={() => {
              update(() => empty());
              onCancel();
            }}
          >
            Cancel annotations
          </button>
        </fieldset>
        <p className="field-hint">
          Local PNG output · original dimensions and transparency preserved. Copy/download export
          the committed image.
        </p>
      </aside>
    </>
  );
}
