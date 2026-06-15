import { useEffect, useRef, useState } from "react";
import { Film, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { readSystemLang, subscribeSystemLang, text, type Lang } from "@/lib/i18n";
import { buildApiUrl, parseApiResponse } from "@/lib/runtimeApi";
import { buildRuntimeSettingsHeaders } from "@/lib/runtimeSettings";
import { ProShowVideoEditor } from "@/features/video-editor/components/ProShowVideoEditor";

type GeneratedResource = {
  kind: "video";
  fileName: string;
  relativePath: string;
  url: string;
  sizeBytes: number;
  createdAtMs: number;
};

type ResourceOverview = {
  video: GeneratedResource[];
};

type RenderLibrary = "ffmpeg" | "remotion";

export default function VideoCreate() {
  const [lang, setLang] = useState<Lang>(() => readSystemLang("en"));
  const [videos, setVideos] = useState<GeneratedResource[]>([]);
  const [uploading, setUploading] = useState(false);
  const [renderLibrary, setRenderLibrary] = useState<RenderLibrary>("remotion");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => subscribeSystemLang(setLang), []);
  useEffect(() => {
    refreshVideos().catch((error) => toast.error(error instanceof Error ? error.message : "Could not load videos."));
  }, []);

  async function refreshVideos() {
    const overview = await parseApiResponse<ResourceOverview>(await fetch(buildApiUrl("/api/resources"), {
      headers: buildRuntimeSettingsHeaders(),
    }));
    setVideos(overview.video || []);
  }

  async function handleUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error(text(lang, "Please choose a video first.", "Vui lòng chọn video trước."));
      return;
    }

    const formData = new FormData();
    formData.append("video", file);
    setUploading(true);
    try {
      await parseApiResponse<GeneratedResource>(await fetch(buildApiUrl("/api/resources/video"), {
        method: "POST",
        headers: buildRuntimeSettingsHeaders(),
        body: formData,
      }));
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success(text(lang, "Video saved to the studio library.", "Đã lưu video vào thư viện studio."));
      await refreshVideos();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text(lang, "Could not upload video.", "Không upload được video."));
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="flex w-full flex-col gap-6 px-4 py-6 text-foreground 2xl:px-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{text(lang, "Video Create", "Tạo/chỉnh video")}</h1>
        <p className="text-sm text-muted-foreground">
          {text(lang, "Upload media, build a lightweight ProShow-style timeline, export MP4, or save existing videos into the local studio library.", "Upload ảnh/âm thanh/video, dựng timeline kiểu ProShow cơ bản, export MP4 hoặc lưu video có sẵn vào thư viện local studio.")}
        </p>
      </header>

      <Card className="border-border/70 bg-muted/10">
        <CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_260px] md:items-center">
          <div>
            <h2 className="font-semibold">{text(lang, "Render library", "Thư viện render")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {text(lang, "Use one ProShow-style timeline editor, then choose whether MP4 export runs through FFmpeg or Remotion.", "Dùng một editor timeline kiểu ProShow, sau đó chọn export MP4 bằng FFmpeg hoặc Remotion.")}
            </p>
          </div>
          <Select value={renderLibrary} onValueChange={(value) => setRenderLibrary(value as RenderLibrary)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ffmpeg">FFmpeg — ProShow timeline</SelectItem>
              <SelectItem value="remotion">Remotion — ProShow timeline</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <ProShowVideoEditor renderEngine={renderLibrary} onVideoCreated={refreshVideos} />

      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> {text(lang, "Upload video", "Upload video")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="video-upload">{text(lang, "Video file", "File video")}</Label>
              <Input id="video-upload" ref={fileInputRef} type="file" accept="video/mp4,video/quicktime,video/webm,.m4v" />
              <p className="text-xs text-muted-foreground">
                {text(lang, "Supported formats: MP4, MOV, M4V, WEBM. The file is copied into generated-videos.", "Hỗ trợ: MP4, MOV, M4V, WEBM. File sẽ được copy vào generated-videos.")}
              </p>
            </div>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {text(lang, "Save to library", "Lưu vào thư viện")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2"><Film className="h-5 w-5" /> {text(lang, "Video library", "Thư viện video")}</CardTitle>
            <Button variant="outline" size="sm" onClick={() => void refreshVideos()}>{text(lang, "Refresh", "Tải lại")}</Button>
          </CardHeader>
          <CardContent>
            {videos.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {videos.map((video) => (
                  <article key={video.relativePath} className="space-y-2 rounded-xl border p-3">
                    <video controls className="aspect-video w-full rounded-lg bg-black" src={video.url} />
                    <p className="truncate text-sm font-medium" title={video.fileName}>{video.fileName}</p>
                    <p className="break-all text-xs text-muted-foreground">{video.relativePath}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                {text(lang, "No videos in the local library yet.", "Chưa có video trong thư viện local.")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
