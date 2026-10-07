import { useRef, useState } from 'react';
import { ArrowUpRight, Clipboard, ImagePlus, Upload } from 'lucide-react';
interface Props {
  onFiles: (files: File[]) => void;
  onError: (message: string) => void;
  busy?: boolean;
  compact?: boolean;
}
export function InputDrop({ onFiles, onError, busy = false, compact = false }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  async function paste() {
    try {
      if (!navigator.clipboard?.read)
        throw new Error('Use Ctrl/Cmd + V to paste an image, or browse files.');
      const items = await navigator.clipboard.read();
      const files: File[] = [];
      for (const item of items) {
        const type = item.types.find((t) => ['image/png', 'image/jpeg', 'image/webp'].includes(t));
        if (type)
          files.push(
            new File([await item.getType(type)], `clipboard-${Date.now()}.${type.split('/')[1]}`, {
              type,
            }),
          );
      }
      if (!files.length)
        throw new Error(
          'No supported image found on the clipboard. Copy an image, then paste again.',
        );
      onFiles(files);
    } catch (e) {
      onError(
        e instanceof Error
          ? e.message
          : 'Clipboard access was denied. Use Ctrl/Cmd + V or browse files.',
      );
    }
  }
  return (
    <div
      className={`input-drop ${compact ? 'compact' : ''} ${drag ? 'dragging' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        if (!busy) setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        if (!busy) onFiles(Array.from(e.dataTransfer.files));
      }}
    >
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        aria-label="Browse images"
        className="visually-hidden"
        tabIndex={-1}
        disabled={busy}
        onChange={(e) => {
          if (e.target.files) onFiles(Array.from(e.target.files));
          e.target.value = '';
        }}
      />
      <div className="drop-icon">
        <ImagePlus size={28} strokeWidth={1.4} />
      </div>
      <span className="eyebrow">ANYTHING IN. ANYTHING OUT.</span>
      <h2>{busy ? 'Opening your images…' : 'Start with what you have.'}</h2>
      <p>Drop an image here. See where it takes you.</p>
      <div className="drop-actions">
        <button className="button" disabled={busy} onClick={() => input.current?.click()}>
          <Upload size={16} /> Browse images <ArrowUpRight size={15} />
        </button>
        <button className="button button-light" disabled={busy} onClick={() => void paste()}>
          <Clipboard size={16} /> Paste image
        </button>
      </div>
      <span className="drop-note">PNG, JPEG, WebP · Up to 25 MiB · Ctrl / ⌘ + V to paste</span>
      <span className="local-note">
        <span className="status-dot" /> Your images stay on your device
      </span>
    </div>
  );
}
