import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Copy,
  Crop,
  Download,
  Image,
  Maximize,
  Plus,
  RotateCw,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
  GitBranch,
  LockKeyhole,
  Eraser,
  Pencil,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Brand } from '../ui/Brand';
import { InputDrop } from '../ui/InputDrop';
import { Properties } from '../ui/Properties';
import { CropOverlay } from '../ui/CropOverlay';
import { useObjectUrl } from '../ui/useObjectUrl';
import { useWorkspace } from '../state/workspace';
import { compatible, registry } from '../core/registry';
import { copyObject, downloadObject } from '../core/export';
import type { OperationId, Parameters, TransformObject } from '../core/types';
const AnnotationEditor = lazy(() => import('../ui/AnnotationEditor'));
const icons = {
  annotate: Pencil,
  crop: Crop,
  resize: Maximize,
  rotate: RotateCw,
  convert: SlidersHorizontal,
  compress: Sparkles,
  'remove-bg': Eraser,
};
const descriptions = {
  annotate: 'Labels, arrows and highlights',
  crop: 'Keep what matters',
  resize: 'Find the right size',
  rotate: 'Change perspective',
  convert: 'Choose your format',
  compress: 'Lighten the file',
  'remove-bg': 'Keep just the subject',
};
function bytes(n: number) {
  return n >= 1024 * 1024
    ? `${(n / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(n / 1024))} KB`;
}
function HistoryNode({
  object,
  label,
  active,
  disabled,
  onSelect,
  parent,
}: {
  object: TransformObject;
  label: string;
  active: boolean;
  disabled: boolean;
  onSelect: () => void;
  parent: string;
}) {
  const url = useObjectUrl(object);
  return (
    <button
      className={`history-node ${active ? 'active' : ''}`}
      disabled={disabled}
      onClick={onSelect}
      aria-pressed={active}
      title={`${label}: ${object.name}. ${parent}`}
    >
      <span className="history-thumbnail">
        {url ? <img src={url} alt="" /> : <Image size={18} />}
      </span>
      <span>
        {label}
        <small>
          {object.metadata.width} × {object.metadata.height}
        </small>
        <small>{parent}</small>
      </span>
      {active ? <Check size={13} /> : null}
    </button>
  );
}
export default function Workspace() {
  const {
    session,
    ready,
    busy,
    progress,
    error,
    notice,
    importFiles,
    apply,
    select,
    clear,
    report,
  } = useWorkspace();
  const active = session.objects.find((o) => o.id === session.activeId);
  const url = useObjectUrl(active);
  const [operationId, setOperationId] = useState<OperationId>('resize');
  const operation = registry.find((o) => o.id === operationId)!;
  const [parameters, setParameters] = useState<Parameters>({});
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [fit, setFit] = useState(true);
  const [editorStarted, setEditorStarted] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const previewImage = useRef<HTMLImageElement>(null);
  // A new active node is a new parameter context, including when branching.
  useEffect(() => {
    if (active) {
      const op =
        compatible(active).find((o) => o.id === operationId) ??
        registry.find((o) => o.id === 'resize')!;
      if (op.id !== operationId) setOperationId(op.id);
      setParameters(op.defaults(active));
    }
  }, [active, operationId]);
  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      if (e.target instanceof Element && e.target.closest('input,textarea,[contenteditable]'))
        return;
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.length) {
        e.preventDefault();
        void importFiles(files);
      } else if (e.clipboardData?.getData('text'))
        report(
          'This release supports image input. Text and URL transformations are on the roadmap.',
        );
    };
    window.addEventListener('paste', handler);
    return () => window.removeEventListener('paste', handler);
  }, [importFiles, report]);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2500);
    return () => clearTimeout(timer);
  }, [copied]);
  async function exportImage(copy: boolean) {
    if (!active) return;
    setExporting(true);
    report(null);
    try {
      if (copy) {
        await copyObject(active);
        setCopied(true);
      } else await downloadObject(active);
    } catch (e) {
      report(e instanceof Error ? e.message : 'Export failed.');
    } finally {
      setExporting(false);
    }
  }
  const disabled = busy || exporting || !ready;
  return (
    <div className="workspace">
      <header className="workspace-header">
        <div className="workspace-brand">
          <Brand small />
          <span className="header-divider" />
          <span className="workspace-title">Workspace</span>
        </div>
        <div className="workspace-header-actions">
          <span className="local-pill">
            <LockKeyhole size={12} /> Local session
          </span>
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="visually-hidden"
            tabIndex={-1}
            aria-label="Import images"
            onChange={(e) => {
              if (e.target.files) void importFiles(Array.from(e.target.files));
              e.target.value = '';
            }}
          />
          <button
            className="button button-light new-input"
            disabled={disabled}
            onClick={() => fileInput.current?.click()}
          >
            <Plus size={15} /> Add image
          </button>
          {active ? (
            <>
              <button
                className="button button-light copy-button"
                disabled={disabled}
                onClick={() => void exportImage(true)}
              >
                {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                className="button"
                disabled={disabled}
                onClick={() => void exportImage(false)}
              >
                <Download size={15} /> Download
              </button>
            </>
          ) : null}
        </div>
      </header>
      {error ? (
        <div className="workspace-feedback error" role="alert">
          <span>{error}</span>
          <button aria-label="Dismiss error" onClick={() => report(null)}>
            <X size={16} />
          </button>
        </div>
      ) : null}
      {notice ? (
        <div className="workspace-feedback" role="status">
          {notice}
        </div>
      ) : null}
      {!ready ? (
        <div className="empty-workspace">
          <p role="status">Recovering your local workspace…</p>
        </div>
      ) : !active ? (
        <div className="empty-workspace">
          <Link to="/" className="back-link">
            <ArrowLeft size={14} /> Back to home
          </Link>
          <InputDrop
            compact
            busy={disabled}
            onFiles={(files) => void importFiles(files)}
            onError={report}
          />
          <p className="session-note">
            A temporary space to make something useful.
            <br />
            Your session stays in this browser for 24 hours.
          </p>
        </div>
      ) : (
        <>
          <div className="workspace-body">
            <aside className="transform-sidebar">
              <span className="panel-label">TRANSFORM</span>
              <div className="operation-list">
                {compatible(active).map((op) => {
                  const Icon = icons[op.id];
                  return (
                    <button
                      key={op.id}
                      className={`operation-button ${operationId === op.id ? 'selected' : ''}`}
                      onClick={() => {
                        setOperationId(op.id);
                        if (op.id === 'annotate') setEditorStarted(true);
                      }}
                      disabled={disabled}
                      aria-pressed={operationId === op.id}
                    >
                      <Icon size={18} />
                      <span>
                        {op.name}
                        <small>{descriptions[op.id]}</small>
                      </span>
                      <ChevronRight size={14} />
                    </button>
                  );
                })}
              </div>
              <div className="sidebar-bottom">
                <GitBranch size={18} />
                <p>
                  Try another direction.
                  <small>Select any earlier step to start a new branch.</small>
                </p>
              </div>
            </aside>
            <section className="preview-panel" aria-label="Image preview">
              <div className="preview-info">
                <span className="filename">{active.name}</span>
                <span>
                  {active.metadata.width} × {active.metadata.height}
                  <span className="info-dot">·</span>
                  {bytes(active.size)}
                  <span className="format-tag">{active.mimeType.split('/')[1].toUpperCase()}</span>
                </span>
              </div>
              <div className={`preview-canvas ${fit ? '' : 'actual-size'}`} aria-busy={busy}>
                {url ? (
                  <div className="image-wrapper">
                    <img
                      ref={previewImage}
                      src={url}
                      alt={`Preview of ${active.name}`}
                      className="preview-image"
                      draggable={false}
                    />
                    {operationId === 'crop' ? (
                      <CropOverlay
                        key={active.id}
                        image={previewImage}
                        width={active.metadata.width!}
                        height={active.metadata.height!}
                        parameters={parameters}
                        disabled={disabled}
                        onChange={(next) => {
                          setParameters(next);
                          if (error) report(null);
                        }}
                      />
                    ) : null}
                  </div>
                ) : (
                  <p>Loading preview…</p>
                )}
                {busy ? (
                  <div className="processing-overlay" role="status">
                    <span className="spinner" />
                    {progress ?? 'Transforming on your device…'}
                  </div>
                ) : null}
              </div>
              <div className="preview-footer">
                <span>
                  <span className="status-dot" /> Original preserved
                </span>
                <button onClick={() => setFit(!fit)} aria-pressed={fit}>
                  <Maximize size={13} />
                  {fit ? 'Fit to canvas' : 'Actual size'}
                </button>
              </div>
            </section>
            {editorStarted ? (
              <Suspense fallback={<p role="status">Loading annotation editor…</p>}>
                <AnnotationEditor
                  object={active}
                  image={previewImage}
                  visible={operationId === 'annotate'}
                  disabled={disabled}
                  onCancel={() => setOperationId('resize')}
                  onApply={async (annotations) => {
                    const id = active.id;
                    await apply(
                      registry.find((o) => o.id === 'annotate')!,
                      { annotations },
                    );
                    return useWorkspace.getState().session.activeId !== id;
                  }}
                />
              </Suspense>
            ) : null}
            {operationId !== 'annotate' ? (
              <Properties
                object={active}
                operation={operation}
                parameters={parameters}
                setParameters={setParameters}
                busy={disabled}
                onApply={() => void apply(operation, parameters)}
              />
            ) : null}
          </div>
          <section className="history-panel" aria-label="Transformation history">
            <div className="history-heading">
              <span className="panel-label">YOUR TRANSFORMATION PATH</span>
              <span>
                {session.objects.length} {session.objects.length === 1 ? 'object' : 'objects'} ·
                select a step to branch
              </span>
            </div>
            <div className="history-nodes">
              {session.objects.map((object, index) => {
                const record = session.operations.find((op) => op.outputIds.includes(object.id));
                const parent = record
                  ? `From step ${session.objects.findIndex((o) => o.id === record.inputIds[0]) + 1}`
                  : 'Root image';
                return (
                  <HistoryNode
                    key={object.id}
                    object={object}
                    active={active.id === object.id}
                    disabled={disabled}
                    label={`${index + 1}. ${record ? (registry.find((op) => op.id === record.transformationId)?.name ?? record.transformationId) : 'Original'}`}
                    parent={parent}
                    onSelect={() => select(object.id)}
                  />
                );
              })}
              <span className="history-next">
                <Plus size={15} /> What next?
              </span>
            </div>
          </section>
        </>
      )}
      <footer className="workspace-footer">
        <span>
          <span className="status-dot" /> Nothing uploaded. Everything stays local.
        </span>
        <AlertDialog.Root>
          <AlertDialog.Trigger asChild>
            <button className="clear-button" disabled={disabled || session.objects.length === 0}>
              <Trash2 size={13} /> Clear session
            </button>
          </AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Overlay className="dialog-overlay" />
            <AlertDialog.Content className="dialog-content">
              <AlertDialog.Title>Clear this workspace?</AlertDialog.Title>
              <AlertDialog.Description>
                This removes your images and transformation history from this browser. Download
                anything you want to keep first.
              </AlertDialog.Description>
              <div className="dialog-actions">
                <AlertDialog.Cancel asChild>
                  <button className="button button-light">Keep working</button>
                </AlertDialog.Cancel>
                <AlertDialog.Action asChild>
                  <button className="button" onClick={() => void clear()}>
                    Clear session
                  </button>
                </AlertDialog.Action>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      </footer>
    </div>
  );
}
