import { ImagePlus, Link, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LongContentStudio } from "./useLongContentStudio";

export function BackgroundImagePanel({ studio: s }: { studio: LongContentStudio }) {
  const [url, setUrl] = useState("");
  return (
    <Card className="space-y-4 border-border/70 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.34),0_0_28px_rgba(59,130,246,0.06)]">
      <div>
        <h2 className="font-semibold">Ảnh nền video</h2>
        <p className="mt-1 text-xs text-muted-foreground">Nhập link ảnh hoặc upload nhiều ảnh. Duration trống sẽ tự chia đều theo độ dài video.</p>
      </div>
      <div className="grid gap-2 lg:grid-cols-[1fr_150px_170px]">
        <div className="relative">
          <Link className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://.../background.jpg" />
        </div>
        <Button type="button" variant="outline" onClick={() => { s.addBackgroundUrl(url); setUrl(""); }}>
          <ImagePlus className="mr-2 h-4 w-4" /> Thêm link
        </Button>
        <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground">
          <Upload className="h-4 w-4" /> Upload ảnh
          <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => s.uploadBackgroundFiles(event.target.files)} />
        </label>
      </div>
      {s.backgroundImages.length ? (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {s.backgroundImages.map((item, index) => (
            <div key={item.id} className="grid grid-cols-[56px_1fr_92px_32px] items-center gap-2 rounded-lg border border-border/70 bg-background/35 p-2">
              <img src={item.src} alt="" className="h-12 w-14 rounded object-cover" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{index + 1}. {item.label}</p>
                <p className="text-xs text-muted-foreground">{item.image ? "Đã tải" : "Đang tải..."}</p>
              </div>
              <div>
                <Label className="sr-only">Duration</Label>
                <Input value={item.durationSec ?? ""} inputMode="decimal" placeholder="auto" onChange={(event) => s.updateBackgroundDuration(item.id, event.target.value)} />
              </div>
              <button type="button" className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => s.removeBackground(item.id)}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
