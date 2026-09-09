import { Film, Layers3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PresetVideoPreviewSection } from "../types";
import { formatPresetSeconds } from "./PresetVideoControls";

type Props = {
  sections: readonly PresetVideoPreviewSection[];
  selectedId: string;
  disabled?: boolean;
  onSelect: (sectionId: string) => void;
};

export function PresetVideoSectionSelector({
  sections,
  selectedId,
  disabled,
  onSelect,
}: Props) {
  if (!sections.length) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers3 className="h-4 w-4" />
          Video preview / chỉnh lyric
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Chọn một phần để nhảy preview tới đúng bài và chỉ hiện lyric của bài đó trong editor.
          Export vẫn giữ nguyên toàn bộ video nếu bạn không đổi đoạn export.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {sections.map((section) => {
            const active = section.id === selectedId;
            return (
              <Button
                key={section.id}
                type="button"
                variant={active ? "default" : "outline"}
                disabled={disabled}
                className="h-auto min-h-20 justify-start whitespace-normal px-3 py-3 text-left"
                onClick={() => onSelect(section.id)}
              >
                <span className="flex min-w-0 items-start gap-2">
                  <Film className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-xs font-bold uppercase tracking-wide">{section.label}</span>
                    <span className="mt-1 block line-clamp-2 text-xs font-medium">{section.title}</span>
                    <span className="mt-1 block text-[10px] opacity-70">
                      {formatPresetSeconds(section.startSeconds)} → {formatPresetSeconds(section.endSeconds)}
                    </span>
                  </span>
                </span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
