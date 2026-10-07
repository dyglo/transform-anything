import * as Select from '@radix-ui/react-select';
import * as Switch from '@radix-ui/react-switch';
import { Check, ChevronDown, LockKeyhole, ArrowRight } from 'lucide-react';
import type { Parameters, TransformationDefinition, TransformObject } from '../core/types';
interface Props {
  object: TransformObject;
  operation: TransformationDefinition;
  parameters: Parameters;
  setParameters: (p: Parameters) => void;
  busy: boolean;
  onApply: () => void;
}
function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <Select.Root
        value={value}
        onValueChange={(v) => {
          if (options.some((o) => o.value === v)) onChange(v);
        }}
      >
        <Select.Trigger className="select-trigger" aria-label={label}>
          <Select.Value />
          <Select.Icon>
            <ChevronDown size={15} />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className="select-content" position="popper" sideOffset={5}>
            <Select.Viewport>
              {options.map((o) => (
                <Select.Item key={o.value} value={o.value} className="select-item">
                  <Select.ItemText>{o.label}</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check size={14} />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </label>
  );
}
export function Properties({
  object,
  operation,
  parameters: p,
  setParameters,
  busy,
  onApply,
}: Props) {
  function set(key: string, value: number | string | boolean) {
    const next = { ...p, [key]: value };
    if (operation.id === 'resize' && p.lock && (key === 'width' || key === 'height')) {
      const ratio = object.metadata.width! / object.metadata.height!;
      if (key === 'width') next.height = Math.max(1, Math.round(Number(value) / ratio));
      else next.width = Math.max(1, Math.round(Number(value) * ratio));
    }
    setParameters(next);
  }
  function number(key: string, label: string, min = 1) {
    return (
      <label className="field" key={key}>
        <span>
          {label}
          <small aria-hidden="true">px</small>
        </span>
        <input
          aria-label={label}
          type="number"
          min={min}
          step="1"
          value={String(p[key] ?? '')}
          onChange={(e) => set(key, e.target.value === '' ? '' : Number(e.target.value))}
        />
      </label>
    );
  }
  return (
    <aside className="properties">
      <span className="panel-label">PROPERTIES</span>
      <h2>{operation.name}</h2>
      <p className="property-description">
        {operation.id === 'crop'
          ? 'Keep the part that matters.'
          : operation.id === 'resize'
            ? 'The right size for your next step.'
            : operation.id === 'rotate'
              ? 'A fresh perspective.'
              : operation.id === 'compress'
                ? 'Less weight. Same possibilities.'
                : operation.id === 'remove-bg'
                  ? 'Keep your subject. Lose the background.'
                  : 'A new format for a new purpose.'}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onApply();
        }}
      >
        <fieldset disabled={busy}>
          {operation.id === 'remove-bg' ? (
            <>
              <p className="field-hint">
                Automatically isolate the main subject and create a transparent PNG at the original
                image size.
              </p>
              <p className="field-hint">
                Best with a clear subject. Fine hair and complex backgrounds may need further
                editing.
              </p>
              <p className="field-hint">
                First use loads about 18 MiB of processing files. Your image stays on your device.
              </p>
            </>
          ) : null}
          {operation.id === 'crop' ? (
            <>
              <div className="field-row">
                {number('x', 'Left', 0)}
                {number('y', 'Top', 0)}
              </div>
              <div className="field-row">
                {number('width', 'Width')}
                {number('height', 'Height')}
              </div>
              <p className="field-hint">
                Drag a corner to resize, or drag inside to move. You can also enter exact pixel
                values here.
              </p>
            </>
          ) : null}
          {operation.id === 'resize' ? (
            <>
              <div className="field-row">
                {number('width', 'Width')}
                {number('height', 'Height')}
              </div>
              <div className="switch-row">
                <label htmlFor="aspect-lock">
                  <LockKeyhole size={14} /> Lock aspect ratio
                </label>
                <Switch.Root
                  id="aspect-lock"
                  className="switch"
                  checked={Boolean(p.lock)}
                  onCheckedChange={(v) => set('lock', v)}
                >
                  <Switch.Thumb className="switch-thumb" />
                </Switch.Root>
              </div>
            </>
          ) : null}
          {operation.id === 'rotate' ? (
            <Choice
              label="Rotation"
              value={String(p.angle)}
              options={[
                { value: '90', label: '90° clockwise' },
                { value: '180', label: '180°' },
                { value: '270', label: '90° counterclockwise' },
              ]}
              onChange={(v) => set('angle', Number(v))}
            />
          ) : null}
          {operation.id === 'convert' || operation.id === 'compress' ? (
            <>
              <Choice
                label="Output format"
                value={String(p.format)}
                options={(operation.id === 'compress'
                  ? ['image/jpeg', 'image/webp']
                  : ['image/png', 'image/jpeg', 'image/webp']
                ).map((value) => ({
                  value,
                  label: value === 'image/jpeg' ? 'JPEG' : value === 'image/webp' ? 'WebP' : 'PNG',
                }))}
                onChange={(v) => set('format', v)}
              />
              {p.format !== 'image/png' ? (
                <label className="field quality-field">
                  <span>
                    Quality <strong>{Number(p.quality ?? 90)}%</strong>
                  </span>
                  <input
                    aria-label="Quality"
                    type="range"
                    min="1"
                    max="100"
                    value={Number(p.quality ?? 90)}
                    onChange={(e) => set('quality', Number(e.target.value))}
                  />
                  <div className="range-labels">
                    <small>Smaller file</small>
                    <small>More detail</small>
                  </div>
                </label>
              ) : (
                <p className="field-hint">
                  PNG uses lossless encoding and preserves transparency. Quality settings do not
                  apply.
                </p>
              )}
              {p.format === 'image/jpeg' ? (
                <p className="field-hint">Transparent areas become white in JPEG.</p>
              ) : null}
            </>
          ) : null}
          <button className="button apply-button" type="submit">
            {busy ? 'Transforming…' : `Apply ${operation.name.toLowerCase()}`}
            <ArrowRight size={16} />
          </button>
        </fieldset>
      </form>
      <div className="property-local">
        <span className="status-dot" /> Processed on your device
        <small>Your original stays untouched.</small>
      </div>
    </aside>
  );
}
