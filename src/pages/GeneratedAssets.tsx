import { Download, FileAudio, FileVideo, RefreshCcw, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSystemLang } from "@/hooks/use-system-lang";
import {
  deleteGeneratedAsset,
  deleteGeneratedAssets,
  getGeneratedAssets,
  type GeneratedAsset,
  type GeneratedAssetKind,
} from "@/lib/generatedAssetsApi";
import { text, type Lang } from "@/lib/i18n";

export default function GeneratedAssets() {
  const lang = useSystemLang();
  const [audio, setAudio] = useState<GeneratedAsset[]>([]);
  const [video, setVideo] = useState<GeneratedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const totals = useMemo(() => ({
    audioSize: audio.reduce((sum, item) => sum + item.sizeBytes, 0),
    videoSize: video.reduce((sum, item) => sum + item.sizeBytes, 0),
  }), [audio, video]);

  useEffect(() => { void refresh(); }, []);

  async function refresh() {
    setLoading(true);
    try {
      const data = await getGeneratedAssets();
      setAudio(data.audio);
      setVideo(data.video);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text(lang, "Could not load the file list.", "Không tải được danh sách file."));
    } finally {
      setLoading(false);
    }
  }

  async function removeOne(kind: GeneratedAssetKind, item: GeneratedAsset) {
    if (!window.confirm(text(lang, `Delete file "${item.fileName}"?`, `Xóa file "${item.fileName}"?`))) return;
    const key = `${kind}:${item.relativePath}`;
    setBusyKey(key);
    try {
      await deleteGeneratedAsset(kind, item.relativePath);
      if (kind === "audio") setAudio((current) => current.filter((asset) => asset.relativePath !== item.relativePath));
      else setVideo((current) => current.filter((asset) => asset.relativePath !== item.relativePath));
      toast.success(text(lang, "File deleted.", "Đã xóa file."));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text(lang, "Could not delete the file.", "Xóa file thất bại."));
    } finally {
      setBusyKey("");
    }
  }

  async function removeAll(kind: GeneratedAssetKind) {
    const label = assetKindLabel(lang, kind);
    if (!window.confirm(text(lang, `Delete all generated ${label} files?`, `Xóa toàn bộ file ${label} đã tạo?`))) return;
    setBusyKey(`${kind}:all`);
    try {
      const result = await deleteGeneratedAssets(kind);
      if (kind === "audio") setAudio([]);
      else setVideo([]);
      toast.success(text(lang, `Deleted ${result.deleted} ${label} file(s).`, `Đã xóa ${result.deleted} file ${label}.`));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text(lang, `Could not delete all ${label} files.`, `Xóa toàn bộ ${label} thất bại.`));
    } finally {
      setBusyKey("");
    }
  }

  return (
    <main className="min-h-screen bg-background p-4 text-foreground">
      <section className="mx-auto max-w-7xl space-y-4">
        <Card className="flex flex-col gap-3 border-border/70 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-bold">{text(lang, "Files Management", "Quản lý file đã tạo")}</h1>
            <p className="text-sm text-muted-foreground">{text(lang, "View, download, delete individual files, or clear all generated voice/video files on the server.", "Xem, tải xuống, xóa từng file hoặc xóa toàn bộ voice/video trên server.")}</p>
          </div>
          <Button variant="outline" onClick={refresh} disabled={loading}>
            <RefreshCcw className="mr-2 h-4 w-4" /> {text(lang, "Refresh", "Tải lại")}
          </Button>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <SummaryCard title={text(lang, "Voice", "Voice")} count={audio.length} size={totals.audioSize} icon={<FileAudio className="h-5 w-5 text-emerald-300" />} />
          <SummaryCard title={text(lang, "Video", "Video")} count={video.length} size={totals.videoSize} icon={<FileVideo className="h-5 w-5 text-sky-300" />} />
        </div>

        <Tabs defaultValue="video" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:w-[420px]">
            <TabsTrigger value="video">{text(lang, "Video", "Video")} ({video.length})</TabsTrigger>
            <TabsTrigger value="audio">{text(lang, "Voice", "Voice")} ({audio.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="video">
            <AssetList lang={lang} kind="video" items={video} loading={loading} busyKey={busyKey} onDelete={removeOne} onDeleteAll={removeAll} />
          </TabsContent>
          <TabsContent value="audio">
            <AssetList lang={lang} kind="audio" items={audio} loading={loading} busyKey={busyKey} onDelete={removeOne} onDeleteAll={removeAll} />
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}

function SummaryCard(props: { title: string; count: number; size: number; icon: ReactNode }) {
  return (
    <Card className="flex items-center justify-between gap-4 border-border/70 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted/30">{props.icon}</div>
        <div>
          <p className="font-semibold">{props.title}</p>
          <p className="text-xs text-muted-foreground">{props.count} file · {formatBytes(props.size)}</p>
        </div>
      </div>
    </Card>
  );
}

function AssetList(props: {
  lang: Lang;
  kind: GeneratedAssetKind;
  items: GeneratedAsset[];
  loading: boolean;
  busyKey: string;
  onDelete: (kind: GeneratedAssetKind, item: GeneratedAsset) => void;
  onDeleteAll: (kind: GeneratedAssetKind) => void;
}) {
  const label = assetKindLabel(props.lang, props.kind);
  return (
    <Card className="space-y-4 border-border/70 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-semibold">{props.kind === "audio" ? text(props.lang, "Voice files", "File voice") : text(props.lang, "Video files", "File video")}</h2>
          <p className="text-xs text-muted-foreground">{props.loading ? text(props.lang, "Loading...", "Đang tải...") : text(props.lang, `${props.items.length} generated file(s).`, `${props.items.length} file đã tạo.`)}</p>
        </div>
        <Button variant="destructive" disabled={!props.items.length || props.busyKey === `${props.kind}:all`} onClick={() => props.onDeleteAll(props.kind)}>
          <Trash2 className="mr-2 h-4 w-4" /> {text(props.lang, `Delete all ${label}`, `Xóa toàn bộ ${label}`)}
        </Button>
      </div>

      <div className="grid gap-3">
        {!props.loading && !props.items.length ? <EmptyState lang={props.lang} label={label} /> : null}
        {props.items.map((item) => (
          <div key={item.relativePath} className="grid gap-3 rounded-lg border border-border bg-muted/10 p-3 md:grid-cols-[1fr_auto] md:items-center">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="min-w-0 truncate font-medium">{item.fileName}</p>
                <Badge variant="outline">{formatBytes(item.sizeBytes)}</Badge>
              </div>
              <p className="truncate text-xs text-muted-foreground">{item.relativePath}</p>
              <p className="text-xs text-muted-foreground">{formatDate(item.createdAtMs)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={item.url} target="_blank" rel="noreferrer">
                  <Download className="mr-2 h-4 w-4" /> {text(props.lang, "Open / download", "Mở / tải")}
                </a>
              </Button>
              <Button variant="destructive" size="sm" disabled={props.busyKey === `${props.kind}:${item.relativePath}`} onClick={() => props.onDelete(props.kind, item)}>
                <Trash2 className="mr-2 h-4 w-4" /> {text(props.lang, "Delete", "Xóa")}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function EmptyState({ label, lang }: { label: string; lang: Lang }) {
  return <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{text(lang, `No ${label} files on the server yet.`, `Chưa có file ${label} nào trên server.`)}</div>;
}

function assetKindLabel(lang: Lang, kind: GeneratedAssetKind) {
  return kind === "audio" ? text(lang, "voice", "voice") : text(lang, "video", "video");
}

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(size >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function formatDate(value: number) {
  if (!Number.isFinite(value)) return "";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
