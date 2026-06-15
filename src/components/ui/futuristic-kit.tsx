import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type GlowAccent = "cyan" | "pink" | "orange" | "blue" | "emerald" | "slate";

const glow = {
  cyan: "border-cyan-300/80 bg-cyan-400 text-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.55)] hover:bg-cyan-300",
  pink: "border-pink-300/80 bg-pink-400 text-white shadow-[0_0_18px_rgba(244,114,182,0.55)] hover:bg-pink-300",
  orange: "border-orange-300/80 bg-orange-400 text-slate-950 shadow-[0_0_18px_rgba(251,146,60,0.5)] hover:bg-orange-300",
  blue: "border-sky-300/80 bg-sky-500 text-white shadow-[0_0_18px_rgba(14,165,233,0.5)] hover:bg-sky-400",
  emerald: "border-emerald-300/80 bg-emerald-400 text-slate-950 shadow-[0_0_18px_rgba(52,211,153,0.45)] hover:bg-emerald-300",
  slate: "border-slate-500/80 bg-slate-700 text-slate-50 shadow-[0_0_14px_rgba(148,163,184,0.25)] hover:bg-slate-600",
} satisfies Record<GlowAccent, string>;

const soft = {
  cyan: "border-cyan-300/50 bg-cyan-400/10 text-cyan-100",
  pink: "border-pink-300/50 bg-pink-400/10 text-pink-100",
  orange: "border-orange-300/50 bg-orange-400/10 text-orange-100",
  blue: "border-sky-300/50 bg-sky-400/10 text-sky-100",
  emerald: "border-emerald-300/50 bg-emerald-400/10 text-emerald-100",
  slate: "border-slate-500/60 bg-slate-800/70 text-slate-100",
} satisfies Record<GlowAccent, string>;

type FuturisticButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  accent?: GlowAccent;
  shape?: "pill" | "tag" | "notch" | "square";
  icon?: React.ReactNode;
  iconSide?: "left" | "right";
  active?: boolean;
};

function FuturisticButton({
  accent = "cyan",
  shape = "pill",
  icon,
  iconSide = "right",
  active,
  className,
  children,
  ...props
}: FuturisticButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 border px-5 text-xs font-bold uppercase tracking-[0.18em] transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        shape === "pill" && "rounded-full",
        shape === "tag" && "rounded-xl after:-mb-5 after:h-0 after:w-0 after:border-x-[10px] after:border-t-[10px] after:border-x-transparent after:border-t-current",
        shape === "notch" && "rounded-md [clip-path:polygon(10px_0,100%_0,calc(100%-10px)_100%,0_100%)]",
        shape === "square" && "rounded-md",
        active ? glow[accent] : soft[accent],
        className,
      )}
      {...props}
    >
      {icon && iconSide === "left" ? icon : null}
      <span>{children}</span>
      {icon && iconSide === "right" ? icon : null}
    </button>
  );
}

type FuturisticIconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  accent?: GlowAccent;
  active?: boolean;
  label: string;
};

function FuturisticIconButton({ accent = "cyan", active, label, className, children, ...props }: FuturisticIconButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        "grid h-11 w-11 place-items-center rounded-full border text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? glow[accent] : soft[accent],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

type FuturisticPanelProps = React.HTMLAttributes<HTMLDivElement> & {
  title?: React.ReactNode;
  action?: React.ReactNode;
  accent?: GlowAccent;
};

function FuturisticPanel({ title, action, accent = "cyan", className, children, ...props }: FuturisticPanelProps) {
  return (
    <section
      className={cn(
        "rounded-xl border bg-slate-950/80 p-4 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur",
        soft[accent],
        className,
      )}
      {...props}
    >
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title ? <h3 className="text-sm font-bold uppercase tracking-[0.14em]">{title}</h3> : <span />}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

type FuturisticToggleProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> & {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: React.ReactNode;
  accent?: GlowAccent;
};

function FuturisticToggle({ checked, onCheckedChange, label, accent = "cyan", className, ...props }: FuturisticToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      className={cn("inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-200", className)}
      onClick={() => onCheckedChange?.(!checked)}
      {...props}
    >
      <span className={cn("relative h-6 w-12 rounded-full border bg-slate-900 transition", checked ? soft[accent] : "border-slate-600")}>
        <span className={cn("absolute top-1 h-4 w-4 rounded-full transition", checked ? `left-7 ${glow[accent]}` : "left-1 bg-slate-500")} />
      </span>
      {label ? <span>{label}</span> : null}
    </button>
  );
}

type FuturisticMeterProps = React.HTMLAttributes<HTMLDivElement> & {
  value: number;
  max?: number;
  label?: React.ReactNode;
  accent?: GlowAccent;
};

function FuturisticMeter({ value, max = 100, label, accent = "cyan", className, ...props }: FuturisticMeterProps) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {label ? <div className="flex justify-between text-xs font-semibold text-slate-300"><span>{label}</span><span>{Math.round(percent)}%</span></div> : null}
      <div className="h-3 overflow-hidden rounded-full border border-slate-700 bg-slate-950">
        <div className={cn("h-full rounded-full transition-all", glow[accent])} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

type FuturisticOrbProps = React.HTMLAttributes<HTMLDivElement> & {
  value: React.ReactNode;
  label?: React.ReactNode;
  accent?: GlowAccent;
  size?: "sm" | "md" | "lg";
};

function FuturisticOrb({ value, label, accent = "cyan", size = "md", className, ...props }: FuturisticOrbProps) {
  return (
    <div
      className={cn(
        "grid place-items-center rounded-full border bg-slate-950/90 text-center font-bold text-slate-50",
        size === "sm" && "h-20 w-20", size === "md" && "h-28 w-28", size === "lg" && "h-36 w-36",
        glow[accent],
        className,
      )}
      {...props}
    >
      <div><div className="text-lg">{value}</div>{label ? <div className="mt-1 text-[10px] uppercase tracking-[0.16em] opacity-80">{label}</div> : null}</div>
    </div>
  );
}

type FuturisticSearchProps = React.InputHTMLAttributes<HTMLInputElement> & {
  accent?: GlowAccent;
  action?: React.ReactNode;
};

const FuturisticSearch = React.forwardRef<HTMLInputElement, FuturisticSearchProps>(
  ({ accent = "cyan", action, className, ...props }, ref) => (
    <div className={cn("flex h-11 items-center gap-2 rounded-full border bg-slate-950/80 px-4", soft[accent], className)}>
      <Search className="h-4 w-4 shrink-0 opacity-80" />
      <input ref={ref} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" {...props} />
      {action}
    </div>
  ),
);
FuturisticSearch.displayName = "FuturisticSearch";

export {
  FuturisticButton,
  FuturisticIconButton,
  FuturisticMeter,
  FuturisticOrb,
  FuturisticPanel,
  FuturisticSearch,
  FuturisticToggle,
  type GlowAccent,
};
