import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useState } from "react";
import { RefreshCw, Download, FolderOpen, Trash2, FileAudio, FileVideo, History, Play } from "lucide-react";

export const Route = createFileRoute("/resources")({
  component: Resources,
});

const audios = [
  { name: "than-mo-tap-1-001.wav", path: "2026-05-09/than-mo-tap-1-001.wav", time: "11:39 9/5/26", size: "458.0 KB" },
  { name: "than-mo-tap-1.wav", path: "2026-05-09/than-mo-tap-1.wav", time: "11:30 9/5/26", size: "456.5 KB" },
  { name: "than-mo-tap-1-003.wav", path: "2026-05-08/than-mo-tap-1-003.wav", time: "16:33 8/5/26", size: "455.5 KB" },
  { name: "than-mo-tap-1-002.wav", path: "2026-05-08/than-mo-tap-1-002.wav", time: "16:15 8/5/26", size: "456.0 KB" },
  { name: "than-mo-tap-1-001.wav", path: "2026-05-08/than-mo-tap-1-001.wav", time: "15:59 8/5/26", size: "457.0 KB" },
  { name: "than-mo-tap-1.wav", path: "2026-05-08/than-mo-tap-1.wav", time: "13:05 8/5/26", size: "462.0 KB" },
];

const tabs = [
  { id: "audio", label: "Audio", count: 6, icon: FileAudio },
  { id: "video", label: "Video", count: 1, icon: FileVideo },
  { id: "history", label: "Lịch sử đăng", count: 0, icon: History },
] as const;

function Resources() {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("audio");
  const [selected, setSelected] = useState(0);

  return (
    <AppShell>
      <PageHeader
        title="Quản lý tài nguyên"
        description="Xem lại audio, video đã tạo và theo dõi lịch sử đăng YouTube."
        actions={
          <button className="btn-ghost text-sm"><RefreshCw className="size-4" /> Làm mới</button>
        }
      />

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(({ id, label, count, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={
              "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border " +
              (tab === id
                ? "bg-foreground text-background border-foreground shadow-glow"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-accent")
            }
          >
            <Icon className="size-4" />
            {label}
            <span className={"text-xs px-1.5 py-0.5 rounded-md " + (tab === id ? "bg-background/20" : "bg-accent")}>{count}</span>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-2">
          {audios.map((a, i) => {
            const active = i === selected;
            return (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={
                  "w-full text-left surface-card px-4 py-3 transition-all flex items-center gap-4 " +
                  (active ? "ring-2 ring-primary border-primary/40" : "hover:border-border/80")
                }
              >
                <div className={"size-10 rounded-lg grid place-items-center shrink-0 " + (active ? "btn-primary-grad" : "bg-accent")}>
                  <Play className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-sm font-semibold truncate">{a.name}</div>
                  <div className="font-mono text-xs text-muted-foreground truncate">{a.path}</div>
                </div>
                <div className="hidden sm:block text-right text-xs text-muted-foreground shrink-0">
                  <div>{a.time}</div>
                  <div className="text-primary-glow font-medium">{a.size}</div>
                </div>
              </button>
            );
          })}
        </div>

        <aside className="lg:col-span-2">
          <div className="surface-card p-6 lg:sticky lg:top-24 space-y-4">
            <div>
              <h3 className="font-display font-semibold text-lg">Xem trước</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Nghe và quản lý tệp đã chọn</p>
            </div>
            <audio controls className="w-full">
              <source src="" />
            </audio>
            <div className="text-sm">
              <div className="text-xs text-muted-foreground">Đường dẫn</div>
              <div className="font-mono text-sm break-all">{audios[selected].path}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className="h-10 rounded-lg btn-primary-grad font-medium inline-flex items-center justify-center gap-2"><Download className="size-4" /> Tải xuống</button>
              <button className="h-10 rounded-lg border border-border hover:bg-accent inline-flex items-center justify-center gap-2"><FolderOpen className="size-4" /> Mở tệp</button>
            </div>
            <button className="w-full h-10 rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10 inline-flex items-center justify-center gap-2 text-sm font-medium">
              <Trash2 className="size-4" /> Xóa
            </button>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
