import {
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
  type PointerEvent,
  type KeyboardEvent,
} from 'react';
import type { Parameters } from '../core/types';
import { adjustCrop, boundedCrop, type CropHandle, type CropRect } from './cropGeometry';

interface Props {
  image: RefObject<HTMLImageElement | null>;
  width: number;
  height: number;
  parameters: Parameters;
  disabled: boolean;
  onChange: (parameters: Parameters) => void;
}
const corners = [
  { handle: 'nw', label: 'top-left' },
  { handle: 'ne', label: 'top-right' },
  { handle: 'sw', label: 'bottom-left' },
  { handle: 'se', label: 'bottom-right' },
] as const;
export function CropOverlay({ image, width, height, parameters, disabled, onChange }: Props) {
  const overlay = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    id: number;
    handle: CropHandle;
    start: CropRect;
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
  } | null>(null);
  const [bounds, setBounds] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const rect = boundedCrop(parameters, width, height);
  useLayoutEffect(() => {
    const element = image.current;
    if (!element) return;
    const measure = () => {
      const box = element.getBoundingClientRect();
      setBounds({
        left: element.offsetLeft,
        top: element.offsetTop,
        width: box.width,
        height: box.height,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    element.addEventListener('load', measure);
    return () => {
      observer.disconnect();
      element.removeEventListener('load', measure);
    };
  }, [image]);
  function begin(event: PointerEvent, handle: CropHandle) {
    if (disabled || !event.isPrimary || event.button !== 0 || drag.current) return;
    const displayed = image.current?.getBoundingClientRect();
    if (!displayed?.width || !displayed.height) return;
    event.preventDefault();
    event.stopPropagation();
    overlay.current?.setPointerCapture(event.pointerId);
    drag.current = {
      id: event.pointerId,
      handle,
      start: rect,
      x: event.clientX,
      y: event.clientY,
      scaleX: width / displayed.width,
      scaleY: height / displayed.height,
    };
    onChange({ ...parameters, ...rect });
  }
  function move(event: PointerEvent) {
    const gesture = drag.current;
    if (!gesture || disabled || event.pointerId !== gesture.id) return;
    onChange({
      ...parameters,
      ...adjustCrop(
        gesture.start,
        gesture.handle,
        (event.clientX - gesture.x) * gesture.scaleX,
        (event.clientY - gesture.y) * gesture.scaleY,
        width,
        height,
      ),
    });
  }
  function end(event: PointerEvent) {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null;
    if (overlay.current?.hasPointerCapture(event.pointerId))
      overlay.current.releasePointerCapture(event.pointerId);
  }
  function key(event: KeyboardEvent, handle: CropHandle) {
    if (disabled) return;
    const direction = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }[event.key];
    if (!direction) return;
    event.preventDefault();
    const step = event.shiftKey ? 10 : 1;
    onChange({
      ...parameters,
      ...adjustCrop(rect, handle, direction[0] * step, direction[1] * step, width, height),
    });
  }
  if (!bounds?.width || !bounds.height) return null;
  return (
    <div
      ref={overlay}
      className="crop-overlay"
      style={bounds}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={() => {
        drag.current = null;
      }}
    >
      <div
        className="crop-outline"
        role="group"
        aria-label="Crop selection"
        style={{
          left: `${(rect.x / width) * 100}%`,
          top: `${(rect.y / height) * 100}%`,
          width: `${(rect.width / width) * 100}%`,
          height: `${(rect.height / height) * 100}%`,
        }}
      >
        <button
          type="button"
          className="crop-move"
          aria-label="Move crop selection"
          disabled={disabled}
          onPointerDown={(e) => begin(e, 'move')}
          onKeyDown={(e) => key(e, 'move')}
          title="Drag to move. Arrow keys move 1px; Shift moves 10px."
        />
        {corners.map((corner) => (
          <button
            type="button"
            key={corner.handle}
            className={`crop-handle crop-handle-${corner.handle}`}
            aria-label={`Resize crop from ${corner.label}`}
            disabled={disabled}
            onPointerDown={(e) => begin(e, corner.handle)}
            onKeyDown={(e) => key(e, corner.handle)}
            title="Drag to resize. Arrow keys adjust 1px; Shift adjusts 10px."
          />
        ))}
      </div>
    </div>
  );
}
