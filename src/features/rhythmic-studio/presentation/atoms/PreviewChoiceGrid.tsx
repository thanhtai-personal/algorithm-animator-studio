import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface PreviewChoiceOption {
  value: string;
  label: string;
  description?: string;
  preview: ReactNode;
}

export function PreviewChoiceGrid({
  label,
  value,
  options,
  onChange,
  columns = "grid-cols-2",
  className,
}: {
  label: string;
  value: string;
  options: PreviewChoiceOption[];
  onChange: (value: string) => void;
  columns?: string;
  className?: string;
}) {
  return <div className="space-y-2">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    <div className={cn("grid gap-2", columns, className)}>
      {options.map((option) => {
        const active = option.value === value;
        return <button
          key={option.value}
          type="button"
          aria-pressed={active}
          onClick={() => onChange(option.value)}
          className={cn(
            "group rounded-xl border bg-background/70 p-2 text-left transition hover:border-primary/45 hover:bg-primary/[0.04]",
            active ? "border-primary bg-primary/[0.08] shadow-sm" : "border-border",
          )}
        >
          <div className={cn("overflow-hidden rounded-lg border", active ? "border-primary/40" : "border-border/60")}>{option.preview}</div>
          <div className="mt-2 space-y-0.5">
            <div className="text-sm font-semibold leading-4">{option.label}</div>
            {option.description ? <div className="text-[11px] leading-4 text-muted-foreground">{option.description}</div> : null}
          </div>
        </button>;
      })}
    </div>
  </div>;
}
