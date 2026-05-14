import { Download, MonitorSpeaker } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PublicWebBanner() {
  const isPublicWeb = import.meta.env.VITE_PUBLIC_WEB === "true";
  const downloadUrl = String(import.meta.env.VITE_DESKTOP_DOWNLOAD_URL || "").trim();

  if (!isPublicWeb) return null;

  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <MonitorSpeaker className="mt-0.5 h-5 w-5 text-amber-300" />
          <div>
            <p className="font-semibold">Bản web public đang chạy ở chế độ giới hạn.</p>
            <p className="text-amber-100/80">Browser vẫn tạo animation/export cơ bản được, nhưng Piper local, FFmpeg, chọn folder máy và YouTube secret cần dùng Desktop app.</p>
          </div>
        </div>
        {downloadUrl ? (
          <Button asChild size="sm" className="bg-amber-300 text-slate-950 hover:bg-amber-200">
            <a href={downloadUrl} target="_blank" rel="noreferrer">
              <Download className="mr-2 h-4 w-4" /> Tải Desktop app
            </a>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
