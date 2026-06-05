import { Check, ChevronLeft, ChevronRight, ExternalLink, RefreshCcw, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getGeneratedAssets, type GeneratedAsset, uploadGeneratedVideo } from "@/lib/generatedAssetsApi";
import type { Lang } from "@/lib/i18n";
import { appendYoutubeDescriptionCredit, type YoutubeAlgorithmMetadata } from "@/lib/youtubeMetadata";
import type { useYoutubeChannelManager } from "../useYoutubeChannelManager";

type Manager = ReturnType<typeof useYoutubeChannelManager>;

type Props = Pick<Manager,
  "canUpload" | "displayedDescription" | "form" | "lastExported" | "loading" | "playlists" | "result" | "selectedFile" | "selectedMusicLicense" | "setForm" | "setVideoFile" | "upload" | "videoFile"
> & {
  lang: Lang;
};

const PAGE_SIZE = 80;
const ROW_HEIGHT = 78;
const LIST_HEIGHT = 390;
const OVERSCAN = 4;

export function YoutubeUploadCard({ canUpload, displayedDescription, form, lang, lastExported, loading, playlists, result, selectedFile, selectedMusicLicense, setForm, setVideoFile, upload, videoFile }: Props) {
  const vi = lang === "vi";
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedAsset[]>([]);
  const [activeTab, setActiveTab] = useState<"upload" | "metadata">("upload");
  const [loadingGenerated, setLoadingGenerated] = useState(false);
  const [generatedMetadataApplied, setGeneratedMetadataApplied] = useState(false);
  const [selectedGeneratedPath, setSelectedGeneratedPath] = useState("");
  const [page, setPage] = useState(0);
  const [listScrollTop, setListScrollTop] = useState(0);
  const pageCount = Math.max(1, Math.ceil(generatedVideos.length / PAGE_SIZE));
  const pageItems = useMemo(() => generatedVideos.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [generatedVideos, page]);
  const virtualState = useMemo(() => getVirtualState(pageItems.length, listScrollTop), [pageItems.length, listScrollTop]);

  useEffect(() => {
    void refreshGeneratedVideos();
  }, []);

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount - 1));
  }, [pageCount]);

  async function refreshGeneratedVideos() {
    setLoadingGenerated(true);
    try {
      const data = await getGeneratedAssets();
      setGeneratedVideos(data.video);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : txt(vi, "Không tải được danh sách video đã tạo.", "Could not load generated videos."));
    } finally {
      setLoadingGenerated(false);
    }
  }

  async function selectGeneratedVideo(relativePath: string) {
    const asset = generatedVideos.find((item) => item.relativePath === relativePath);
    if (!asset) return;
    setLoadingGenerated(true);
    try {
      const response = await fetch(asset.url);
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const blob = await response.blob();
      setVideoFile(new File([blob], asset.fileName, { type: blob.type || "video/mp4" }));
      setSelectedGeneratedPath(asset.relativePath);
      setGeneratedMetadataApplied(applyGeneratedVideoMetadata(asset));
      toast.success(txt(vi, "Đã chọn video đã tạo.", "Generated video selected."));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : txt(vi, "Không chọn được video đã tạo.", "Could not select generated video."));
    } finally {
      setLoadingGenerated(false);
    }
  }

  function applyGeneratedVideoMetadata(asset: GeneratedAsset) {
    const sessionMatch = lastExported?.fileName === asset.fileName || lastExported?.fileName === asset.relativePath;
    const metadata = asset.youtubeMetadata ?? (sessionMatch ? lastExported?.youtubeMetadata : undefined);
    const descriptionAppend = asset.youtubeDescriptionAppend ?? (sessionMatch ? lastExported?.youtubeDescriptionAppend : undefined);

    if (!metadata) return false;
    setForm((current) => applyMetadataToForm(current, metadata, descriptionAppend));
    return true;
  }

  async function handleUploadFile(file: File | null | undefined) {
    if (!file) return;
    setLoadingGenerated(true);
    setGeneratedMetadataApplied(false);
    setVideoFile(file);
    try {
      const asset = await uploadGeneratedVideo(file);
      setGeneratedVideos((current) => [asset, ...current.filter((item) => item.relativePath !== asset.relativePath)]);
      setSelectedGeneratedPath(asset.relativePath);
      setPage(0);
      setListScrollTop(0);
      toast.success(txt(vi, "Đã lưu video vào danh sách generated.", "Video saved to generated list."));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : txt(vi, "Không lưu được video vào generated data.", "Could not save video to generated data."));
    } finally {
      setLoadingGenerated(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 rounded-lg border border-border bg-muted/20 p-1 md:grid-cols-2">
        <button type="button" className={sourceTabClass(activeTab === "upload")} onClick={() => setActiveTab("upload")}>{txt(vi, "Chọn video", "Select Video")}</button>
        <button type="button" className={sourceTabClass(activeTab === "metadata")} onClick={() => setActiveTab("metadata")}>{txt(vi, "Metadata", "Metadata")}</button>
      </div>

      {activeTab === "upload" ? <Card className="space-y-4 p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold">{txt(vi, "Video nguồn", "Source video")}</h2>
            {lastExported ? <p className="mt-1 text-sm text-emerald-300">{txt(vi, "Video mới export:", "Latest exported video:")} {lastExported.fileName}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow transition hover:bg-primary/90">
              <Upload className="h-4 w-4" /> {txt(vi, "Upload video", "Upload video")}
              <input type="file" accept="video/*" className="hidden" onChange={(event) => void handleUploadFile(event.target.files?.[0])} />
            </label>
            <Button variant="outline" onClick={refreshGeneratedVideos} disabled={loadingGenerated}>
              <RefreshCcw className="mr-2 h-4 w-4" />{txt(vi, "Tải lại", "Refresh")}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{txt(vi, "Video upload từ máy sẽ được lưu và hiển thị ngay trong danh sách video đã tạo bên dưới.", "Uploaded videos are saved and shown immediately in the generated video list below.")}</p>
        <GeneratedVideoList
          key={page}
          items={pageItems}
          selectedPath={selectedGeneratedPath}
          virtualState={virtualState}
          onScrollTopChange={setListScrollTop}
          onSelect={selectGeneratedVideo}
          vi={vi}
        />
        <div className="flex flex-col gap-2 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span>{txt(vi, "Tổng video:", "Total videos:")} {generatedVideos.length}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => { setPage((value) => Math.max(0, value - 1)); setListScrollTop(0); }}><ChevronLeft className="h-4 w-4" /></Button>
            <span>{page + 1}/{pageCount}</span>
            <Button variant="outline" size="sm" disabled={page >= pageCount - 1} onClick={() => { setPage((value) => Math.min(pageCount - 1, value + 1)); setListScrollTop(0); }}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
        {!loadingGenerated && !generatedVideos.length ? <p className="text-xs text-muted-foreground">{txt(vi, "Chưa có video đã tạo trong thư mục generated data.", "No generated videos found in generated data.")}</p> : null}
        {selectedFile ? <p className="text-xs text-muted-foreground">{txt(vi, "Đang chọn:", "Selected:")} {selectedFile.name} · {(selectedFile.size / 1024 / 1024).toFixed(1)} MB</p> : null}
      </Card> : null}

      {activeTab === "metadata" ? <Card className="space-y-4 p-4">
        <h2 className="font-semibold">{txt(vi, "Metadata đăng video", "Video publishing metadata")}</h2>
        <Field label={txt(vi, "Tiêu đề", "Title")} value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
        <div>
          <Label>{txt(vi, "Mô tả", "Description")}</Label>
          <Textarea className="mt-2 min-h-48" value={displayedDescription} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          {lastExported?.youtubeMetadata && !videoFile ? <p className="mt-2 text-xs text-emerald-300">{txt(vi, "Đã tự điền metadata theo thuật toán của video export.", "Metadata was auto-filled from the exported video algorithm.")}</p> : null}
          {generatedMetadataApplied ? <p className="mt-2 text-xs text-emerald-300">{txt(vi, "Đã tự điền metadata đi kèm video đã tạo.", "Metadata was auto-filled from the generated video.")}</p> : null}
          {selectedMusicLicense ? <p className="mt-2 text-xs text-yellow-300">{txt(vi, "Bản quyền nhạc đã được thêm vào cuối mô tả.", "Music credit has been appended to the description.")}</p> : null}
        </div>
        <Field label={txt(vi, "Tags", "Tags")} value={form.tags} onChange={(value) => setForm({ ...form, tags: value })} />
        <div className="grid gap-3 md:grid-cols-3">
          <Field label={txt(vi, "Category ID", "Category ID")} value={form.categoryId} onChange={(value) => setForm({ ...form, categoryId: value })} />
          <div>
            <Label>{txt(vi, "Quyền riêng tư", "Privacy")}</Label>
            <Select value={form.privacyStatus} onValueChange={(value) => setForm({ ...form, privacyStatus: value })}>
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="private">{txt(vi, "Riêng tư", "Private")}</SelectItem>
                <SelectItem value="unlisted">{txt(vi, "Không công khai", "Unlisted")}</SelectItem>
                <SelectItem value="public">{txt(vi, "Công khai", "Public")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Field label={txt(vi, "Lịch đăng", "Publish at")} type="datetime-local" value={form.publishAt || ""} onChange={(value) => setForm({ ...form, publishAt: value })} />
        </div>
        <div>
          <Label>{txt(vi, "Playlist", "Playlist")}</Label>
          <Select value={form.playlistId || "none"} onValueChange={(value) => setForm({ ...form, playlistId: value === "none" ? "" : value })}>
            <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{txt(vi, "Không thêm playlist", "Do not add to playlist")}</SelectItem>
              {playlists.map((playlist) => <SelectItem key={playlist.id} value={playlist.id}>{playlist.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Toggle label={txt(vi, "Dành cho trẻ em", "Made for Kids")} checked={form.madeForKids} onChange={(value) => setForm({ ...form, madeForKids: value })} />
          <Toggle label={txt(vi, "Thông báo subscriber", "Notify subscribers")} checked={form.notifySubscribers} onChange={(value) => setForm({ ...form, notifySubscribers: value })} />
          <Toggle label={txt(vi, "Nội dung tổng hợp/AI", "Synthetic media")} checked={form.containsSyntheticMedia} onChange={(value) => setForm({ ...form, containsSyntheticMedia: value })} />
        </div>
        <Button className="w-full bg-red-500 text-white hover:bg-red-600" onClick={upload} disabled={loading || !canUpload}>{txt(vi, "Upload YouTube", "Upload YouTube")}</Button>
      </Card> : null}

      {result ? (
        <Card className="space-y-2 p-4">
          <h2 className="font-semibold text-emerald-300">{txt(vi, "Kết quả upload", "Upload result")}</h2>
          <p className="text-sm">{result.title || form.title}</p>
          {result.url ? <a className="inline-flex items-center gap-2 text-sm text-red-400 underline" href={result.url} target="_blank" rel="noreferrer">{txt(vi, "Mở video", "Open video")} <ExternalLink className="h-3.5 w-3.5" /></a> : null}
          {result.playlistWarning ? <p className="text-xs text-yellow-300">{result.playlistWarning}</p> : null}
        </Card>
      ) : null}
    </div>
  );
}

function Field(props: { label: string; value: string; type?: string; onChange: (value: string) => void }) {
  return <div><Label>{props.label}</Label><Input className="mt-2" type={props.type ?? "text"} value={props.value} onChange={(event) => props.onChange(event.target.value)} /></div>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2"><Label>{label}</Label><Switch checked={checked} onCheckedChange={onChange} /></div>;
}

function GeneratedVideoList(props: {
  items: GeneratedAsset[];
  selectedPath: string;
  virtualState: ReturnType<typeof getVirtualState>;
  vi: boolean;
  onScrollTopChange: (value: number) => void;
  onSelect: (relativePath: string) => void;
}) {
  if (!props.items.length) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        {txt(props.vi, "Chưa có video trong trang này.", "No videos on this page.")}
      </div>
    );
  }

  const visibleItems = props.items.slice(props.virtualState.start, props.virtualState.end);
  return (
    <div
      className="overflow-auto rounded-lg border border-border"
      style={{ height: Math.min(LIST_HEIGHT, props.items.length * ROW_HEIGHT) }}
      onScroll={(event) => props.onScrollTopChange(event.currentTarget.scrollTop)}
    >
      <div className="relative" style={{ height: props.items.length * ROW_HEIGHT }}>
        <div className="absolute inset-x-0" style={{ transform: `translateY(${props.virtualState.start * ROW_HEIGHT}px)` }}>
          {visibleItems.map((asset) => {
            const selected = asset.relativePath === props.selectedPath;
            return (
              <button
                key={asset.relativePath}
                type="button"
                className={`flex h-[78px] w-full items-center gap-3 border-b border-border px-3 text-left transition hover:bg-muted/30 ${selected ? "bg-muted/40" : ""}`}
                onClick={() => props.onSelect(asset.relativePath)}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${selected ? "border-emerald-400 text-emerald-300" : "border-border text-muted-foreground"}`}>
                  {selected ? <Check className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{asset.fileName}</span>
                  <span className="block truncate text-xs text-muted-foreground">{asset.relativePath}</span>
                  <span className="block text-xs text-muted-foreground">{formatSize(asset.sizeBytes)} · {formatDate(asset.createdAtMs)}</span>
                </span>
                {asset.youtubeMetadata ? <span className="rounded-full border border-emerald-400/40 px-2 py-0.5 text-xs text-emerald-300">{txt(props.vi, "Metadata", "Metadata")}</span> : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function sourceTabClass(active: boolean) {
  return `rounded-md px-3 py-2 text-sm font-medium transition ${active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/60 hover:text-foreground"}`;
}

function getVirtualState(itemCount: number, scrollTop: number) {
  const visibleCount = Math.ceil(LIST_HEIGHT / ROW_HEIGHT);
  const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const end = Math.min(itemCount, start + visibleCount + OVERSCAN * 2);
  return { start, end };
}

function formatSize(sizeBytes: number) {
  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(createdAtMs: number) {
  if (!createdAtMs) return "-";
  return new Date(createdAtMs).toLocaleString();
}

function applyMetadataToForm<T extends { title: string; description: string; tags: string }>(form: T, metadata: YoutubeAlgorithmMetadata, descriptionAppend?: string): T {
  return {
    ...form,
    ...metadata,
    description: appendYoutubeDescriptionCredit(metadata.description, descriptionAppend, metadata.lang),
  };
}

function txt(vi: boolean, viText: string, enText: string) {
  return vi ? viText : enText;
}
