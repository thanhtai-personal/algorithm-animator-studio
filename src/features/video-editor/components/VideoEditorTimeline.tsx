import { useEffect, useMemo, useRef, useState, type DragEvent, type MouseEvent, type ReactNode, type UIEvent } from "react";
import { Music2, Pause, Play, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { VIDEO_EDITOR_TRANSITIONS } from "../lib/videoEditorConstants";
import type { VideoEditorAsset, VideoEditorClip, VideoEditorFitMode, VideoEditorTransition } from "../lib/videoEditorTypes";

export type TrackKind = "visual" | "audio";
const MEDIA_PAGE_SIZE = 12;

type TimelineTrackProps = {
  title: string;
  icon: ReactNode;
  clips: VideoEditorClip[];
  assets: VideoEditorAsset[];
  track: TrackKind;
  onDrop: (event: DragEvent<HTMLElement>, track: TrackKind, beforeClipId?: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<VideoEditorClip>) => void;
};

export function TimelineTrack(props: TimelineTrackProps) {
  return (
    <section className="grid gap-2 md:grid-cols-[160px_minmax(0,1fr)]">
      <div className="flex items-center gap-2 text-sm font-semibold text-cyan-100">{props.icon}{props.title}</div>
      <div className="flex min-h-28 gap-2 overflow-x-auto rounded-md border border-dashed border-border/80 bg-background/50 p-2" onDragOver={(event) => event.preventDefault()} onDrop={(event) => props.onDrop(event, props.track)}>
        {props.clips.length ? props.clips.map((clip) => (
          <TimelineClip key={clip.id} clip={clip} asset={props.assets.find((asset) => asset.id === clip.assetId)} track={props.track} onDrop={props.onDrop} onRemove={props.onRemove} onUpdate={props.onUpdate} />
        )) : <div className="grid min-w-full place-items-center text-sm text-muted-foreground">Drop media here</div>}
      </div>
    </section>
  );
}

export function MediaBin(props: { assets: VideoEditorAsset[]; onFiles: (files: FileList | null) => void }) {
  const [query, setQuery] = useState("");
  const filteredAssets = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return props.assets;
    return props.assets.filter((asset) => `${asset.name} ${asset.type} ${getAssetBadge(asset)}`.toLowerCase().includes(term));
  }, [props.assets, query]);
  const visualAssets = useMemo(() => filteredAssets.filter((asset) => asset.type !== "audio"), [filteredAssets]);
  const audioAssets = useMemo(() => filteredAssets.filter((asset) => asset.type === "audio"), [filteredAssets]);

  return (
    <section className="space-y-3 rounded-lg border bg-background/40 p-3">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <h3 className="text-sm font-semibold">Kho media</h3>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted/40"><Upload className="h-4 w-4" /> Upload<input type="file" multiple accept="image/*,audio/*,video/*" className="hidden" onChange={(event) => props.onFiles(event.target.files)} /></label>
      </div>
      <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm media, nhạc nền, audio..." />
      <MediaGroup title="Ảnh / video" empty="Không có ảnh/video phù hợp" assets={visualAssets} />
      <MediaGroup title="Nhạc nền / audio" empty="Không có nhạc/audio phù hợp" assets={audioAssets} />
    </section>
  );
}

function MediaGroup(props: { title: string; empty: string; assets: VideoEditorAsset[] }) {
  const [visibleCount, setVisibleCount] = useState(MEDIA_PAGE_SIZE);
  const visibleAssets = props.assets.slice(0, visibleCount);
  const hasMore = visibleCount < props.assets.length;

  useEffect(() => setVisibleCount(MEDIA_PAGE_SIZE), [props.assets]);

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const target = event.currentTarget;
    const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 48;
    if (nearBottom && hasMore) setVisibleCount((count) => Math.min(props.assets.length, count + MEDIA_PAGE_SIZE));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{props.title}</h4>
        <span className="text-xs text-muted-foreground">{Math.min(visibleCount, props.assets.length)} / {props.assets.length}</span>
      </div>
      <div className="max-h-[34vh] min-h-28 overflow-y-auto pr-1" onScroll={handleScroll}>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          {props.assets.length ? visibleAssets.map((asset) => <MediaAsset key={asset.id} asset={asset} />) : <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground sm:col-span-2 lg:col-span-4">{props.empty}</div>}
        </div>
        {hasMore ? <div className="py-3 text-center text-xs text-muted-foreground">Kéo xuống để load thêm 12 media</div> : null}
      </div>
    </div>
  );
}

function TimelineClip(props: {
  clip: VideoEditorClip;
  asset?: VideoEditorAsset;
  track: TrackKind;
  onDrop: TimelineTrackProps["onDrop"];
  onRemove: TimelineTrackProps["onRemove"];
  onUpdate: TimelineTrackProps["onUpdate"];
}) {
  const { clip } = props;
  return (
    <article draggable onDragStart={(event) => event.dataTransfer.setData("clip-id", clip.id)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => props.onDrop(event, props.track, clip.id)} className="grid w-72 shrink-0 gap-2 rounded-md border bg-card p-2">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium">{props.asset?.name || clip.label}</span>
        <Button size="icon" variant="ghost" onClick={() => props.onRemove(clip.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Duration"><Input type="number" min={1} max={7200} value={clip.durationSeconds} onChange={(event) => props.onUpdate(clip.id, { durationSeconds: Number(event.target.value) })} /></Field>
        {clip.type !== "audio" ? <Field label="Fit"><Select value={clip.fitMode} onValueChange={(value) => props.onUpdate(clip.id, { fitMode: value as VideoEditorFitMode })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cover">cover</SelectItem><SelectItem value="contain">contain</SelectItem></SelectContent></Select></Field> : null}
      </div>
      {clip.type !== "audio" ? (
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_92px]">
          <Field label="Animation chuyển slide">
            <Select value={clip.transition} onValueChange={(value) => props.onUpdate(clip.id, { transition: value as VideoEditorTransition })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{VIDEO_EDITOR_TRANSITIONS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Anim time"><Input type="number" min={0.2} max={8} step={0.1} value={clip.transitionSeconds} onChange={(event) => props.onUpdate(clip.id, { transitionSeconds: Number(event.target.value) })} /></Field>
        </div>
      ) : null}
      {clip.type === "video" ? (
        <div className="grid gap-2">
          <label className="flex items-center justify-between gap-3 rounded-md border bg-muted/20 px-3 py-2 text-sm">
            <span>Âm thanh gốc video</span>
            <Switch checked={clip.keepOriginalAudio === true} onCheckedChange={(checked) => props.onUpdate(clip.id, { keepOriginalAudio: checked })} />
          </label>
          {clip.keepOriginalAudio ? <VolumeField clip={clip} onUpdate={props.onUpdate} label="Volume video" /> : null}
        </div>
      ) : null}
      {clip.type === "audio" ? (
        <VolumeField clip={clip} onUpdate={props.onUpdate} label={props.asset?.source === "silent" ? "Volume" : "Volume audio / voice"} />
      ) : null}
    </article>
  );
}

function VolumeField(props: { clip: VideoEditorClip; label: string; onUpdate: TimelineTrackProps["onUpdate"] }) {
  return (
    <Field label={props.label}>
      <Input
        type="number"
        min={0}
        max={200}
        step={5}
        value={Math.round((props.clip.volume ?? 1) * 100)}
        onChange={(event) => props.onUpdate(props.clip.id, { volume: Number(event.target.value) / 100 })}
      />
    </Field>
  );
}

function MediaAsset({ asset }: { asset: VideoEditorAsset }) {
  const [playing, setPlaying] = useState(false);
  const mediaRef = useRef<HTMLAudioElement | HTMLVideoElement | null>(null);

  function togglePreview(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    const media = mediaRef.current;
    if (!media) return;
    if (playing) {
      media.pause();
      setPlaying(false);
      return;
    }
    void media.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }

  if (asset.type === "audio") {
    return (
      <article draggable onDragStart={(event) => event.dataTransfer.setData("asset-id", asset.id)} className="flex items-center gap-2 rounded-md border bg-card p-2">
        <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={togglePreview} disabled={asset.source === "silent"}>
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </Button>
        <Music2 className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs"><Badge variant="outline">{getAssetBadge(asset)}</Badge><span className="truncate">{asset.name}</span></div>
        </div>
        <audio ref={mediaRef} src={asset.url} onEnded={() => setPlaying(false)} />
      </article>
    );
  }

  return (
    <article draggable onDragStart={(event) => event.dataTransfer.setData("asset-id", asset.id)} className="grid gap-2 rounded-md border bg-card p-2">
      <div className="relative grid aspect-video place-items-center overflow-hidden rounded bg-slate-950 text-muted-foreground">
        {asset.type === "image" ? <img src={asset.url} className="h-full w-full object-cover" alt="" /> : <video ref={mediaRef} src={asset.url} className="h-full w-full object-cover" onEnded={() => setPlaying(false)} />}
        {asset.type === "video" ? (
          <Button size="icon" variant="outline" className="absolute right-2 top-2 h-8 w-8 bg-background/80 backdrop-blur" onClick={togglePreview}>
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </Button>
        ) : null}
      </div>
      <div className="flex items-center gap-2 text-xs"><Badge variant="outline">{getAssetBadge(asset)}</Badge><span className="truncate">{asset.name}</span></div>
    </article>
  );
}

function getAssetBadge(asset: VideoEditorAsset) {
  if (asset.source === "silent") return "im lặng";
  if (asset.source === "system-music") return "nhạc nền";
  return asset.type;
}

function Field(props: { label: string; children: ReactNode }) {
  return <div className="space-y-2"><Label>{props.label}</Label>{props.children}</div>;
}
