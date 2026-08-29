import { useId, type ComponentType } from "react";
import { Upload } from "lucide-react";

export function UploadCard({ icon: Icon, title, hint, accept, onFile }: { icon: ComponentType<{ className?: string }>; title: string; hint: string; accept: string; onFile: (file: File) => Promise<void> }) {
  const id = useId();
  return <label htmlFor={id} className="group flex cursor-pointer items-center gap-3 rounded-xl border bg-background/65 px-3 py-3 transition hover:border-primary/50 hover:bg-primary/[0.04]">
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{title}</span><span className="block truncate text-[11px] text-muted-foreground">{hint}</span></span>
    <Upload className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
    <input id={id} className="sr-only" type="file" accept={accept} onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; if (file) void onFile(file); }} />
  </label>;
}
