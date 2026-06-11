import type { DragEvent, ReactNode } from "react";
import { Music2, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { VIDEO_EDITOR_TRANSITIONS } from "../lib/videoEditorConstants";
import type { VideoEditorAsset, VideoEditorClip, VideoEditorFitMode, VideoEditorTransition } from "../lib/videoEditorTypes";

export type TrackKind = "visual" | "audio";

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
  return (
    <section className="space-y-3 rounded-lg border bg-background/40 p-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Kho media</h3>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted/40"><Upload className="h-4 w-4" /> Upload<input type="file" multiple accept="image/*,audio/*,video/*" className="hidden" onChange={(event) => props.onFiles(event.target.files)} /></label>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {props.assets.length ? props.assets.map((asset) => <MediaAsset key={asset.id} asset={asset} />) : <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground sm:col-span-2 lg:col-span-4">Drop ảnh, video hoặc audio từ máy tính vào editor</div>}
      </div>
    </section>
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
        <Field label="Duration"><Input type="number" min={1} max={180} value={clip.durationSeconds} onChange={(event) => props.onUpdate(clip.id, { durationSeconds: Number(event.target.value) })} /></Field>
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
        <label className="flex items-center justify-between gap-3 rounded-md border bg-muted/20 px-3 py-2 text-sm">
          <span>Âm thanh gốc video</span>
          <Switch checked={clip.keepOriginalAudio === true} onCheckedChange={(checked) => props.onUpdate(clip.id, { keepOriginalAudio: checked })} />
        </label>
      ) : null}
    </article>
  );
}

function MediaAsset({ asset }: { asset: VideoEditorAsset }) {
  return (
    <article draggable onDragStart={(event) => event.dataTransfer.setData("asset-id", asset.id)} className="grid gap-2 rounded-md border bg-card p-2">
      <div className="grid aspect-video place-items-center overflow-hidden rounded bg-slate-950 text-muted-foreground">
        {asset.type === "image" ? <img src={asset.url} className="h-full w-full object-cover" alt="" /> : asset.type === "video" ? <video src={asset.url} muted className="h-full w-full object-cover" /> : <Music2 className="h-7 w-7" />}
      </div>
      <div className="flex items-center gap-2 text-xs"><Badge variant="outline">{asset.type}</Badge><span className="truncate">{asset.name}</span></div>
    </article>
  );
}

function Field(props: { label: string; children: ReactNode }) {
  return <div className="space-y-2"><Label>{props.label}</Label>{props.children}</div>;
}
