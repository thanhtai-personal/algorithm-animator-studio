import { useState, type PropsWithChildren, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = PropsWithChildren<{
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
}>;

export function ControlFrame({ title, subtitle, icon, defaultOpen = true, collapsible = true, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const header = <>
    {icon}
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-semibold">{title}</span>
      {subtitle && <span className="block truncate text-[11px] text-muted-foreground">{subtitle}</span>}
    </span>
    {collapsible && <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />}
  </>;

  return <section className="rounded-2xl border border-primary/25 bg-card/70 shadow-sm backdrop-blur">
    {collapsible
      ? <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center gap-2 px-4 py-3 text-left">{header}</button>
      : <div className="flex w-full items-center gap-2 px-4 py-3 text-left">{header}</div>}
    {(!collapsible || open) && <div className="space-y-4 border-t border-border/60 p-4">{children}</div>}
  </section>;
}
