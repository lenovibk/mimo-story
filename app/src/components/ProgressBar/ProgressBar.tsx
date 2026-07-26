import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  onScrubStart?: () => void;
  onScrubEnd?: () => void;
  disabled?: boolean;
  className?: string;
}

/** Thin, draggable video-progress track - tap or drag anywhere on it to seek. */
export function ProgressBar({
  currentTime,
  duration,
  onSeek,
  onScrubStart,
  onScrubEnd,
  disabled = false,
  className = "",
}: ProgressBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragRatio, setDragRatio] = useState<number | null>(null);

  const ratio = duration > 0 ? (dragRatio ?? currentTime / duration) : 0;
  const clampedRatio = Math.min(1, Math.max(0, ratio));

  const ratioFromPointer = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    if (rect.width === 0) return 0;
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled || duration <= 0) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const r = ratioFromPointer(e.clientX);
    setDragRatio(r);
    onScrubStart?.();
    onSeek(r * duration);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRatio === null) return;
    e.stopPropagation();
    const r = ratioFromPointer(e.clientX);
    setDragRatio(r);
    onSeek(r * duration);
  };

  const handlePointerEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRatio === null) return;
    e.stopPropagation();
    e.currentTarget.releasePointerCapture(e.pointerId);
    setDragRatio(null);
    onScrubEnd?.();
  };

  return (
    <div
      ref={trackRef}
      role="slider"
      aria-label="Video progress"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(currentTime)}
      aria-disabled={disabled}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onClick={(e) => e.stopPropagation()}
      className={`no-select group relative flex h-4 w-full shrink-0 touch-none items-center ${
        disabled ? "opacity-50" : "cursor-pointer"
      } ${className}`}
    >
      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-[#5CC8FF]"
          style={{ width: `${clampedRatio * 100}%` }}
        />
      </div>
      <div
        className="absolute h-3 w-3 -translate-x-1/2 rounded-full bg-white shadow-sm shadow-black/20 ring-2 ring-[#5CC8FF] transition-transform group-active:scale-110"
        style={{ left: `${clampedRatio * 100}%` }}
      />
    </div>
  );
}
