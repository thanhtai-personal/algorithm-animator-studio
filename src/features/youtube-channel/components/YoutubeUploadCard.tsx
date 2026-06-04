import { ExternalLink, RefreshCcw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Lang } from "@/lib/i18n";
import type { useYoutubeChannelManager } from "../useYoutubeChannelManager";

type Manager = ReturnType<typeof useYoutubeChannelManager>;

type Props = Pick<Manager,
  "canUpload" | "displayedDescription" | "form" | "lastExported" | "loading" | "playlists" | "result" | "selectedFile" | "selectedMusicLicense" | "setForm" | "setVideoFile" | "upload" | "useLatestExport" | "videoFile"
> & {
  lang: Lang;
};

export function YoutubeUploadCard({ canUpload, displayedDescription, form, lang, lastExported, loading, playlists, result, selectedFile, selectedMusicLicense, setForm, setVideoFile, upload, useLatestExport, videoFile }: Props) {
  const vi = lang === "vi";
  return (
    <div className="space-y-4">
      <Card className="space-y-4 p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="font-semibold">{txt(vi, "Video nguồn", "Source video")}</h2>
          <Button variant="outline" size="sm" onClick={useLatestExport}>
            <RefreshCcw className="mr-2 h-4 w-4" />{txt(vi, "Lấy video mới export", "Use latest exported video")}
          </Button>
        </div>
        {lastExported ? <p className="text-sm text-emerald-300">{txt(vi, "Video mới export:", "Latest exported video:")} {lastExported.fileName}</p> : <p className="text-sm text-muted-foreground">{txt(vi, "Chưa có video export trong phiên này.", "No exported video in this session yet.")}</p>}
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
          <Upload className="h-4 w-4" /> {txt(vi, "Chọn file video khác (.mp4/.webm)", "Choose another video file (.mp4/.webm)")}
          <input type="file" accept="video/*" className="hidden" onChange={(event) => setVideoFile(event.target.files?.[0] ?? null)} />
        </label>
        {selectedFile ? <p className="text-xs text-muted-foreground">{txt(vi, "Đang chọn:", "Selected:")} {selectedFile.name} · {(selectedFile.size / 1024 / 1024).toFixed(1)} MB</p> : null}
      </Card>

      <Card className="space-y-4 p-4">
        <h2 className="font-semibold">{txt(vi, "Metadata đăng video", "Video publishing metadata")}</h2>
        <Field label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
        <div>
          <Label>Description</Label>
          <Textarea className="mt-2 min-h-48" value={displayedDescription} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          {lastExported?.youtubeMetadata && !videoFile ? <p className="mt-2 text-xs text-emerald-300">{txt(vi, "Đã tự điền metadata theo thuật toán của video export.", "Metadata was auto-filled from the exported video algorithm.")}</p> : null}
          {selectedMusicLicense ? <p className="mt-2 text-xs text-yellow-300">{txt(vi, "Bản quyền nhạc đã được thêm vào cuối mô tả.", "Music credit has been appended to the description.")}</p> : null}
        </div>
        <Field label="Tags" value={form.tags} onChange={(value) => setForm({ ...form, tags: value })} />
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Category ID" value={form.categoryId} onChange={(value) => setForm({ ...form, categoryId: value })} />
          <div>
            <Label>Privacy</Label>
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
          <Label>Playlist</Label>
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
        <Button className="w-full bg-red-500 text-white hover:bg-red-600" onClick={upload} disabled={loading || !canUpload}>Upload YouTube</Button>
      </Card>

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

function txt(vi: boolean, viText: string, enText: string) {
  return vi ? viText : enText;
}
