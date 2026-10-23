import { useEffect, useRef, useState } from "react";
import { Film, Upload } from "lucide-react";
import { SystemLoader } from "@/components/ui/system-loader";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { t, readSystemLang, subscribeSystemLang, type Lang  } from "@/lib/i18n";
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
      toast.error(t(lang, "uiPleaseChooseAVideoFirst"));
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
      toast.success(t(lang, "uiVideoSavedToTheStudioLibrary"));
      await refreshVideos();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t(lang, "uiCouldNotUploadVideo"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="flex w-full flex-col gap-6 px-4 py-6 text-foreground 2xl:px-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t(lang, "uiVideoCreate")}</h1>
        <p className="text-sm text-muted-foreground">
          {t(lang, "uiUploadMediaBuildALightweightProshowStyleTimeline")}
        </p>
      </header>

      <Card className="border-border/70 bg-muted/10">
        <CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_260px] md:items-center">
          <div>
            <h2 className="font-semibold">{t(lang, "uiRenderLibrary")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(lang, "uiUseOneProshowStyleTimelineEditorThenChoose")}
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
            <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> {t(lang, "uiUploadVideo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="video-upload">{t(lang, "uiVideoFile")}</Label>
              <Input id="video-upload" ref={fileInputRef} type="file" accept="video/mp4,video/quicktime,video/webm,.m4v" />
              <p className="text-xs text-muted-foreground">
                {t(lang, "uiSupportedFormatsMp4MovM4vWebmTheFile")}
              </p>
            </div>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? <SystemLoader className="mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
              {t(lang, "uiSaveToLibrary")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2"><Film className="h-5 w-5" /> {t(lang, "uiVideoLibrary")}</CardTitle>
            <Button variant="outline" size="sm" onClick={() => void refreshVideos()}>{t(lang, "uiRefresh")}</Button>
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
                {t(lang, "uiNoVideosInTheLocalLibraryYet")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
