"use client";

import { cn } from "@/utils/className";

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted/70", className)} />;
}

export function CardSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <SkeletonBlock className="h-40 w-full rounded-lg" />
      <SkeletonBlock className="h-4 w-3/4" />
      <SkeletonBlock className="h-4 w-1/2" />
    </div>
  );
}

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
  className?: string;
}

export function TableSkeleton({ rows = 5, cols = 4, className }: TableSkeletonProps) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border", className)}>
      <div className="flex gap-3 border-b border-border bg-muted/50 px-3 py-3">
        {Array.from({ length: cols }).map((_, index) => (
          <SkeletonBlock key={`head-${index}`} className="h-4 flex-1" />
        ))}
      </div>

      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-3 border-b border-border/70 px-3 py-3 last:border-0">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <SkeletonBlock key={`cell-${rowIndex}-${colIndex}`} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function KPISkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={`kpi-${index}`} className="space-y-3 rounded-xl border border-border bg-card p-4">
          <SkeletonBlock className="h-3 w-1/2" />
          <SkeletonBlock className="h-8 w-2/3" />
          <SkeletonBlock className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4 rounded-xl border border-border bg-card p-4", className)}>
      <SkeletonBlock className="h-4 w-48" />
      <SkeletonBlock className="h-64 w-full rounded-lg" />
      <div className="flex gap-3">
        <SkeletonBlock className="h-3 w-20" />
        <SkeletonBlock className="h-3 w-20" />
        <SkeletonBlock className="h-3 w-20" />
      </div>
    </div>
  );
}
