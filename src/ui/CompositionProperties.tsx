import { ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';
import type { Parameters, TransformObject } from '../core/types';
import { compositionPlan } from '../core/composition';
import { useObjectUrl } from './useObjectUrl';
function Source({
  object,
  checked,
  disabled,
  onChange,
}: {
  object: TransformObject;
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
}) {
  const url = useObjectUrl(object);
  return (
    <label className="composition-source">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        aria-label={`Include ${object.name}`}
      />
      {url ? <img src={url} alt="" /> : null}
      <span>
        {object.name}
        <small>
          {object.metadata.width} × {object.metadata.height}
        </small>
      </span>
    </label>
  );
}
export function CompositionProperties({
  available,
  inputs,
  frame,
  p,
  setParameters,
  setIds,
  busy,
  pending,
  previewError,
  onApply,
  onCancel,
}: {
  available: TransformObject[];
  inputs: readonly TransformObject[];
  frame: boolean;
  p: Parameters;
  setParameters: (p: Parameters) => void;
  setIds: (ids: string[]) => void;
  busy: boolean;
  pending: boolean;
  previewError?: string;
  onApply: () => void;
  onCancel: () => void;
}) {
  let dimensions = '',
    validation = '';
  try {
    const plan = compositionPlan(inputs, p, frame);
    dimensions = `${plan.width} × ${plan.height} px · PNG`;
  } catch (e) {
    validation = e instanceof Error ? e.message : 'Check your settings.';
  }
  const set = (key: string, value: string | number) => setParameters({ ...p, [key]: value });
  const number = (key: string, label: string, max = 16384) => (
    <label className="field">
      <span>
        {label}
        <small aria-hidden="true">px</small>
      </span>
      <input
        aria-label={label}
        type="number"
        min="0"
        max={max}
        step="1"
        value={String(p[key] ?? '')}
        onChange={(e) => set(key, e.target.value === '' ? '' : Number(e.target.value))}
      />
    </label>
  );
  const choice = (key: string, label: string, options: [string, string][]) => (
    <label className="field">
      <span>{label}</span>
      <select
        aria-label={label}
        className="select-trigger"
        value={String(p[key] ?? '')}
        onChange={(e) => set(key, e.target.value)}
      >
        {options.map(([v, label]) => (
          <option key={v} value={v}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
  const reorder = (index: number, delta: number) => {
    const ids = inputs.map((o) => o.id);
    [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]];
    setIds(ids);
  };
  return (
    <aside className="properties composition-properties">
      <span className="panel-label">PROPERTIES</span>
      <h2>{frame ? 'Frame' : 'Combine'}</h2>
      <p className="property-description">
        {frame
          ? 'Give your image room to shine.'
          : 'Bring images together in the order you choose.'}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!validation && !pending && !previewError) onApply();
        }}
      >
        <fieldset disabled={busy}>
          {!frame ? (
            <>
              <p className="field-hint">
                Select 2–8 images, including earlier results. Add more with Add image.
              </p>
              <div className="composition-sources">
                {available.map((o) => (
                  <Source
                    key={o.id}
                    object={o}
                    checked={inputs.some((i) => i.id === o.id)}
                    disabled={busy || (!inputs.some((i) => i.id === o.id) && inputs.length >= 8)}
                    onChange={() =>
                      setIds(
                        inputs.some((i) => i.id === o.id)
                          ? inputs.filter((i) => i.id !== o.id).map((i) => i.id)
                          : [...inputs.map((i) => i.id), o.id],
                      )
                    }
                  />
                ))}
              </div>
              <ol className="composition-order" aria-label="Image order">
                {inputs.map((o, i) => (
                  <li key={o.id}>
                    <span>{o.name}</span>
                    <button
                      type="button"
                      aria-label={`Move ${o.name} earlier`}
                      disabled={i === 0}
                      onClick={() => reorder(i, -1)}
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${o.name} later`}
                      disabled={i === inputs.length - 1}
                      onClick={() => reorder(i, 1)}
                    >
                      <ArrowDown size={16} />
                    </button>
                  </li>
                ))}
              </ol>
              {choice('direction', 'Direction', [
                ['horizontal', 'Side by side'],
                ['vertical', 'Stack vertically'],
              ])}
              {choice('sizing', 'Image sizing', [
                ['native', 'Keep original sizes'],
                ['match', 'Match height / width'],
              ])}
              {p.sizing === 'match'
                ? number(
                    'crossSize',
                    p.direction === 'horizontal' ? 'Common height' : 'Common width',
                  )
                : null}
              {choice('alignment', 'Alignment', [
                ['start', 'Start'],
                ['center', 'Center'],
                ['end', 'End'],
              ])}
              {number('gap', 'Gap')}
              <p className="field-hint">
                Images keep their aspect ratio. No stretching or cropping.
              </p>
            </>
          ) : null}
          {number('padding', 'Padding')}
          {frame ? (
            <>
              <div className="field-row">
                {number('border', 'Border', 512)}
                {number('radius', 'Corner radius', 8192)}
              </div>
              <label className="field">
                <span>Border color</span>
                <input
                  type="color"
                  value={String(p.borderColor ?? '#ffffff')}
                  onChange={(e) => set('borderColor', e.target.value)}
                />
              </label>
            </>
          ) : null}
          {choice('background', 'Background', [
            ['transparent', 'Transparent'],
            ['#ffffff', 'White'],
            ['#000000', 'Black'],
            ['#eef2f6', 'Soft gray'],
            ...(p.background !== 'transparent' &&
            !['#ffffff', '#000000', '#eef2f6'].includes(String(p.background))
              ? [[String(p.background), 'Custom color'] as [string, string]]
              : []),
          ])}
          <label className="field">
            <span>Custom background color</span>
            <input
              type="color"
              value={p.background === 'transparent' ? '#ffffff' : String(p.background ?? '#ffffff')}
              onChange={(e) => set('background', e.target.value)}
            />
          </label>
          <p className="field-hint" role="status">
            {validation || previewError || dimensions}
          </p>
          <button
            className="button apply-button"
            type="submit"
            disabled={Boolean(validation || pending || previewError)}
          >
            {busy ? 'Transforming…' : `Apply ${frame ? 'frame' : 'combine'}`}
            <ArrowRight size={16} />
          </button>
          <button className="button button-light apply-button" type="button" onClick={onCancel}>
            Cancel
          </button>
        </fieldset>
      </form>
      <div className="property-local">
        <span className="status-dot" /> Processed on your device
        <small>Apply creates a new image. Originals stay untouched.</small>
      </div>
    </aside>
  );
}
