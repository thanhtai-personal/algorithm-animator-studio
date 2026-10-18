import { useRef } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Replace, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PresetVideoTimelineClip } from "../types";

type Props = {
  clips: readonly PresetVideoTimelineClip[];
  videoSourceUrls: Record<string, string>;
  uploadingSourceId: string;
  disabled?: boolean;
  onAdd: (files: File[]) => void;
  onReplace: (clip: PresetVideoTimelineClip, file: File) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
};

const MAX_OUTFITS = 20;

export function FashionOutfitsCard(props: Props) {
  const addInput = useRef<HTMLInputElement>(null);
  const locked = props.disabled || Boolean(props.uploadingSourceId);
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><ImagePlus className="h-4 w-4" />Ảnh trang phục ({props.clips.length}/{MAX_OUTFITS})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Chọn từ 2 đến 20 ảnh JPG, PNG hoặc WebP, tốt nhất là ảnh toàn thân của cùng một người mẫu với góc chụp tương tự.
          Thứ tự trong danh sách chính là thứ tự thay trang phục. Có thể tải nhiều ảnh cùng lúc.
        </p>
        <input
          ref={addInput}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          disabled={locked || props.clips.length >= MAX_OUTFITS}
          aria-label="Chọn ảnh trang phục"
          onChange={(event) => {
            const files = Array.from(event.target.files || []);
            event.target.value = "";
            if (files.length) props.onAdd(files);
          }}
        />
        <Button
          type="button"
          disabled={locked || props.clips.length >= MAX_OUTFITS}
          onClick={() => addInput.current?.click()}
        >
          <ImagePlus className="mr-2 h-4 w-4" />Thêm ảnh trang phục
        </Button>
        {props.clips.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Chưa có ảnh. Thêm ít nhất 2 ảnh để tạo video thay trang phục.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {props.clips.map((clip, index) => {
              const url = props.videoSourceUrls[clip.id];
              const inputId = `fashion-replace-${clip.id}`;
              return (
                <div key={clip.id} className="min-w-0 overflow-hidden rounded-lg border bg-muted/20">
                  <div className="relative aspect-[9/10] bg-slate-800">
                    {url ? <video src={`${url}#t=0.1`} preload="metadata" muted playsInline className="h-full w-full object-cover" /> : (
                      <div className="grid h-full place-items-center text-xs text-slate-200">
                        {props.uploadingSourceId === clip.id ? "Đang xử lý ảnh..." : "Chưa có ảnh"}
                      </div>
                    )}
                    <span className="absolute left-2 top-2 rounded bg-black/65 px-2 py-1 text-xs font-bold text-white">#{index + 1}</span>
                  </div>
                  <div className="space-y-2 p-3">
                    <p className="truncate text-sm font-medium" title={clip.title}>{clip.title}</p>
                    <div className="flex flex-wrap items-center gap-1">
                      <Button size="icon" variant="outline" aria-label="Lên trước" disabled={locked || index === 0} onClick={() => props.onMove(clip.id, -1)}>
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="outline" aria-label="Xuống sau" disabled={locked || index === props.clips.length - 1} onClick={() => props.onMove(clip.id, 1)}>
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <input
                        id={inputId}
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                        className="sr-only"
                        disabled={locked}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.target.value = "";
                          if (file) props.onReplace(clip, file);
                        }}
                      />
                      <Button size="icon" variant="outline" aria-label="Đổi ảnh" disabled={locked} onClick={() => document.getElementById(inputId)?.click()}>
                        <Replace className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" aria-label="Xóa ảnh" disabled={locked} onClick={() => props.onRemove(clip.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Ảnh chỉ chuyển thành các khung hình tĩnh có chuyển động máy quay nhẹ; hệ thống không tự mặc một chiếc váy lên người mẫu.
        </p>
      </CardContent>
    </Card>
  );
}
