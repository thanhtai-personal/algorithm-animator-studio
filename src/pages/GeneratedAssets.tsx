import { Download, FileAudio, FileVideo, Lock, LockOpen, RefreshCcw, Trash2 } from "lucide-react";
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
import { t, tf, type Lang } from "@/lib/i18n";

const LOCKED_ASSETS_KEY = "kai-studio.generated-assets.locked";

export default function GeneratedAssets() {
  const lang = useSystemLang();
  const [audio, setAudio] = useState<GeneratedAsset[]>([]);
  const [video, setVideo] = useState<GeneratedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [lockedKeys, setLockedKeys] = useState<Set<string>>(() => readLockedKeys());
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
      toast.error(error instanceof Error ? error.message : t(lang, "uiCouldNotLoadTheFileList"));
    } finally {
      setLoading(false);
    }
  }

  async function removeOne(kind: GeneratedAssetKind, item: GeneratedAsset) {
    if (!window.confirm(tf(lang, "uiDeleteFileConfirm", { fileName: item.fileName }))) return;
    const key = `${kind}:${item.relativePath}`;
    setBusyKey(key);
    try {
      await deleteGeneratedAsset(kind, item.relativePath);
      if (kind === "audio") setAudio((current) => current.filter((asset) => asset.relativePath !== item.relativePath));
      else setVideo((current) => current.filter((asset) => asset.relativePath !== item.relativePath));
      toast.success(t(lang, "uiFileDeleted"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t(lang, "uiCouldNotDeleteTheFile"));
    } finally {
      setBusyKey("");
    }
  }

  function toggleLocked(kind: GeneratedAssetKind, item: GeneratedAsset) {
    setLockedKeys((current) => {
      const next = new Set(current);
      const key = assetLockKey(kind, item.relativePath);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      writeLockedKeys(next);
      return next;
    });
  }

  async function removeAll(kind: GeneratedAssetKind) {
    const label = assetKindLabel(lang, kind);
    const lockedPaths = (kind === "audio" ? audio : video)
      .filter((item) => lockedKeys.has(assetLockKey(kind, item.relativePath)))
      .map((item) => item.relativePath);
    if (!window.confirm(tf(lang, "uiDeleteAllGeneratedFilesConfirm", { label }))) return;
    setBusyKey(`${kind}:all`);
    try {
      const result = await deleteGeneratedAssets(kind, lockedPaths);
      if (kind === "audio") setAudio((current) => current.filter((item) => lockedPaths.includes(item.relativePath)));
      else setVideo((current) => current.filter((item) => lockedPaths.includes(item.relativePath)));
      const lockedText = lockedPaths.length ? tf(lang, "uiLockedFilesKept", { count: lockedPaths.length }) : "";
      toast.success(tf(lang, "uiDeletedGeneratedFiles", { count: result.deleted, label }) + lockedText);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tf(lang, "uiCouldNotDeleteAllGeneratedFiles", { label }));
    } finally {
      setBusyKey("");
    }
  }

  return (
    <main className="min-h-screen bg-background p-4 text-foreground">
      <section className="mx-auto max-w-7xl space-y-4">
        <Card className="flex flex-col gap-3 border-border/70 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-bold">{t(lang, "uiFilesManagement")}</h1>
            <p className="text-sm text-muted-foreground">{t(lang, "uiViewDownloadDeleteIndividualFilesOrClearAll")}</p>
          </div>
          <Button variant="outline" onClick={refresh} disabled={loading}>
            <RefreshCcw className="mr-2 h-4 w-4" /> {t(lang, "uiRefresh")}
          </Button>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <SummaryCard title={t(lang, "uiVoice")} count={audio.length} size={totals.audioSize} icon={<FileAudio className="h-5 w-5 text-emerald-300" />} />
          <SummaryCard title={t(lang, "uiVideo")} count={video.length} size={totals.videoSize} icon={<FileVideo className="h-5 w-5 text-sky-300" />} />
        </div>

        <Tabs defaultValue="video" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:w-[420px]">
            <TabsTrigger value="video">{t(lang, "uiVideo")} ({video.length})</TabsTrigger>
            <TabsTrigger value="audio">{t(lang, "uiVoice")} ({audio.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="video">
            <AssetList lang={lang} kind="video" items={video} loading={loading} busyKey={busyKey} lockedKeys={lockedKeys} onDelete={removeOne} onDeleteAll={removeAll} onToggleLocked={toggleLocked} />
          </TabsContent>
          <TabsContent value="audio">
            <AssetList lang={lang} kind="audio" items={audio} loading={loading} busyKey={busyKey} lockedKeys={lockedKeys} onDelete={removeOne} onDeleteAll={removeAll} onToggleLocked={toggleLocked} />
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
  lockedKeys: Set<string>;
  onDelete: (kind: GeneratedAssetKind, item: GeneratedAsset) => void;
  onDeleteAll: (kind: GeneratedAssetKind) => void;
  onToggleLocked: (kind: GeneratedAssetKind, item: GeneratedAsset) => void;
}) {
  const label = assetKindLabel(props.lang, props.kind);
  return (
    <Card className="space-y-4 border-border/70 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-semibold">{props.kind === "audio" ? t(props.lang, "uiVoiceFiles") : t(props.lang, "uiVideoFiles")}</h2>
          <p className="text-xs text-muted-foreground">{props.loading ? t(props.lang, "uiLoading") : tf(props.lang, "uiGeneratedFileCount", { count: props.items.length })}</p>
        </div>
        <Button
          variant="destructive"
          disabled={!props.items.length || props.busyKey === `${props.kind}:all`}
          title={t(props.lang, "uiDeleteAllUnlockedMedia")}
          onClick={() => props.onDeleteAll(props.kind)}
        >
          <Trash2 className="mr-2 h-4 w-4" /> {tf(props.lang, "uiDeleteAllLabel", { label })}
        </Button>
      </div>

      <div className="grid gap-3">
        {!props.loading && !props.items.length ? <EmptyState lang={props.lang} label={label} /> : null}
        {props.items.map((item) => {
          const locked = props.lockedKeys.has(assetLockKey(props.kind, item.relativePath));
          return (
          <div key={item.relativePath} className="grid gap-3 rounded-lg border border-border bg-muted/10 p-3 md:grid-cols-[auto_1fr_auto] md:items-center">
            <Button
              variant="outline"
              size="icon"
              className={locked ? "border-yellow-500/60 text-yellow-400 hover:text-yellow-300" : "border-red-500/50 text-red-400 hover:text-red-300"}
              title={locked ? t(props.lang, "uiLockedKeptWhenDeletingAll") : t(props.lang, "uiUnlockedCanBeDeletedByDeleteAll")}
              onClick={() => props.onToggleLocked(props.kind, item)}
            >
              {locked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
            </Button>
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
                  <Download className="mr-2 h-4 w-4" /> {t(props.lang, "uiOpenDownload")}
                </a>
              </Button>
              <Button variant="destructive" size="sm" disabled={props.busyKey === `${props.kind}:${item.relativePath}`} onClick={() => props.onDelete(props.kind, item)}>
                <Trash2 className="mr-2 h-4 w-4" /> {t(props.lang, "uiDelete")}
              </Button>
            </div>
          </div>
        );})}
      </div>
    </Card>
  );
}

function assetLockKey(kind: GeneratedAssetKind, relativePath: string) {
  return `${kind}:${relativePath}`;
}

function readLockedKeys() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCKED_ASSETS_KEY) || "[]");
    return new Set(Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []);
  } catch {
    return new Set<string>();
  }
}

function writeLockedKeys(keys: Set<string>) {
  localStorage.setItem(LOCKED_ASSETS_KEY, JSON.stringify([...keys]));
}

function EmptyState({ label, lang }: { label: string; lang: Lang }) {
  return <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{tf(lang, "uiNoLabelFilesOnTheServerYet", { label })}</div>;
}

function assetKindLabel(lang: Lang, kind: GeneratedAssetKind) {
  return kind === "audio" ? t(lang, "uiVoice2") : t(lang, "uiVideo2");
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
