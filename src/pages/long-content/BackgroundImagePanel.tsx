import { ImagePlus, Link, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LongContentStudio } from "./useLongContentStudio";
import { uiText } from "@/lib/i18n";

export function BackgroundImagePanel({ studio: s }: { studio: LongContentStudio }) {
  const [url, setUrl] = useState("");
  return (
    <Card className="space-y-4 border-border/70 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.34),0_0_28px_rgba(59,130,246,0.06)]">
      <div>
        <h2 className="font-semibold">{uiText("Ảnh nền video")}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{uiText("Nhập link ảnh hoặc upload nhiều ảnh. Duration trống sẽ tự chia đều theo độ dài video.")}</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto] xl:grid-cols-[1fr_150px_170px]">
        <div className="relative">
          <Link className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://.../background.jpg" />
        </div>
        <Button type="button" variant="outline" className="min-w-[150px]" onClick={() => { s.addBackgroundUrl(url); setUrl(""); }}>
          <ImagePlus className="mr-2 h-4 w-4" /> Thêm link
        </Button>
        <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground sm:col-span-2 xl:col-span-1">
          <Upload className="h-4 w-4" /> Upload ảnh
          <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => s.uploadBackgroundFiles(event.target.files)} />
        </label>
      </div>
      {s.backgroundImages.length ? (
        <div className="grid gap-2">
          {s.backgroundImages.map((item, index) => (
            <div key={item.id} className="grid gap-3 rounded-lg border border-border/70 bg-background/35 p-3 sm:grid-cols-[72px_minmax(0,1fr)] xl:grid-cols-[72px_minmax(0,1fr)_104px_36px] xl:items-center">
              <img src={item.src} alt="" className="h-14 w-[72px] rounded-md object-cover" />
              <div className="min-w-0 self-center">
                <p className="truncate text-sm font-medium">{index + 1}. {item.label}</p>
                <p className="text-xs text-muted-foreground">{item.image ? "Đã tải" : "Đang tải..."}</p>
              </div>
              <div className="sm:col-span-2 xl:col-span-1">
                <Label className="mb-1 block text-[11px] text-muted-foreground">{uiText("Duration")}</Label>
                <Input value={item.durationSec ?? ""} inputMode="decimal" placeholder={uiText("auto")} onChange={(event) => s.updateBackgroundDuration(item.id, event.target.value)} />
              </div>
              <button type="button" className="flex h-10 w-full items-center justify-center rounded-md border border-border/70 text-muted-foreground hover:bg-destructive/10 hover:text-destructive sm:col-span-2 xl:col-span-1 xl:w-9 xl:border-0" onClick={() => s.removeBackground(item.id)}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
