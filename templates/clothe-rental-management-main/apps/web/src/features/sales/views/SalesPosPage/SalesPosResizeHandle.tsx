"use client";

interface SalesPosResizeHandleProps {
  ariaLabel: string;
  minWidth: number;
  maxWidth: number;
  width: number;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
}

export function SalesPosResizeHandle({
  ariaLabel,
  minWidth,
  maxWidth,
  width,
  onPointerDown,
  onKeyDown,
}: SalesPosResizeHandleProps) {
  return (
    <div className="relative hidden w-4 shrink-0 lg:flex">
      <div
        role="separator"
        tabIndex={0}
        aria-label={ariaLabel}
        title={ariaLabel}
        aria-orientation="vertical"
        aria-valuemin={minWidth}
        aria-valuemax={maxWidth}
        aria-valuenow={width}
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
        className="group absolute inset-y-0 left-1/2 w-4 -translate-x-1/2 cursor-col-resize touch-none outline-none"
      >
        <span className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border transition-colors group-hover:bg-primary group-focus-visible:bg-primary" />
        <span className="pointer-events-none absolute left-1/2 top-1/2 h-12 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-border/80 transition-colors group-hover:bg-primary/70 group-focus-visible:bg-primary/70" />
        <span className="sr-only">{ariaLabel}</span>
      </div>
    </div>
  );
}
