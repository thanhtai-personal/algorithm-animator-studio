"use client";

interface SettingsUsersPaginationControlsProps {
  perPageLabel: string;
  pageLabel: string;
  prevLabel: string;
  nextLabel: string;
  pageSize: number;
  pageSizeOptions: number[];
  currentPage: number;
  totalPages: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  onChangePageSize: (value: number) => void;
  onPrev: () => void;
  onNext: () => void;
}

export function SettingsUsersPaginationControls({
  perPageLabel,
  pageLabel,
  prevLabel,
  nextLabel,
  pageSize,
  pageSizeOptions,
  currentPage,
  totalPages,
  canGoPrev,
  canGoNext,
  onChangePageSize,
  onPrev,
  onNext,
}: SettingsUsersPaginationControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/10 p-2">
      <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        <span>{perPageLabel}</span>
        <select
          value={pageSize}
          onChange={(event) => onChangePageSize(Number(event.target.value))}
          className="h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={!canGoPrev}
          className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-semibold text-foreground transition hover:bg-accent disabled:opacity-50"
        >
          {prevLabel}
        </button>

        <p className="text-xs text-muted-foreground">
          {pageLabel} {currentPage}/{totalPages}
        </p>

        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext}
          className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-semibold text-foreground transition hover:bg-accent disabled:opacity-50"
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
