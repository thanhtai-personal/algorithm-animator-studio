import { useEffect, useMemo, useState } from "react";
import { Check, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getGeneratedAudioAssets, type GeneratedAsset } from "@/lib/generatedAssetsApi";
import type { PresetVideoExportSettings, PresetVideoLanguage } from "../types";

type Props = {
  presetId: string;
  language: PresetVideoLanguage;
  selectedPath: string;
  disabled: boolean;
  refreshKey: number;
  onSelect: (selection: Pick<PresetVideoExportSettings, "voiceoverAudioRelativePath" | "voiceoverAudioUrl">) => void;
};

export function PresetVideoVoiceoverLibrary({ presetId, language, selectedPath, disabled, refreshKey, onSelect }: Props) {
  const [audio, setAudio] = useState<GeneratedAsset[]>([]);
  const [search, setSearch] = useState("");
  const [previewPath, setPreviewPath] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getGeneratedAudioAssets().then((result) => {
      if (active) setAudio(result);
    }).catch((cause) => {
      if (active) setError(cause instanceof Error ? cause.message : "Unable to load generated voices.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [refreshKey, reload]);

  const ordered = useMemo(() => prioritizePresetVoices(audio, presetId, language), [audio, presetId, language]);
  const filtered = useMemo(() => ordered.filter((asset) => `${asset.fileName} ${asset.relativePath}`.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 30), [ordered, search]);
  const preview = audio.find((asset) => asset.relativePath === previewPath);
  const vi = language === "vi";

  return <div className="space-y-3 rounded-lg border p-3">
    <div className="flex items-center justify-between gap-2">
      <div><p className="text-sm font-medium">{vi ? "Voice đã tạo" : "Previously generated voices"}</p><p className="text-xs text-muted-foreground">{vi ? "Chọn lại file cũ cho preview và export." : "Reuse an existing file in preview and export."}</p></div>
      <Button type="button" variant="ghost" size="icon" aria-label={vi ? "Làm mới danh sách voice" : "Refresh voice list"} disabled={loading} onClick={() => setReload((value) => value + 1)}><RefreshCw className="h-4 w-4" /></Button>
    </div>
    <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input aria-label={vi ? "Tìm voice đã tạo" : "Search generated voices"} placeholder={vi ? "Tìm theo tên file..." : "Search by file name..."} value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" /></div>
    {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
    <div className="max-h-56 space-y-1 overflow-y-auto">
      {loading && !audio.length ? <p className="py-2 text-xs text-muted-foreground">{vi ? "Đang tải voice..." : "Loading voices..."}</p> : null}
      {!loading && !filtered.length ? <p className="py-2 text-xs text-muted-foreground">{vi ? "Không tìm thấy voice đã tạo." : "No generated voices found."}</p> : null}
      {filtered.map((asset) => <div key={asset.relativePath} className="flex min-w-0 items-center gap-2 rounded-md border bg-muted/20 p-2">
        <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium" title={asset.fileName}>{asset.fileName}</p><p className="truncate text-[11px] text-muted-foreground" title={asset.relativePath}>{new Date(asset.createdAtMs).toLocaleString(vi ? "vi-VN" : "en-US")} · {asset.relativePath}</p></div>
        <Button type="button" variant="ghost" size="sm" onClick={() => setPreviewPath(asset.relativePath)} aria-label={`${vi ? "Nghe thử" : "Preview"} ${asset.fileName}`}>{vi ? "Nghe" : "Play"}</Button>
        <Button type="button" variant={selectedPath === asset.relativePath ? "secondary" : "outline"} size="sm" disabled={disabled || selectedPath === asset.relativePath} onClick={() => onSelect({ voiceoverAudioRelativePath: asset.relativePath, voiceoverAudioUrl: asset.url })} aria-label={`${vi ? "Dùng" : "Use"} ${asset.fileName}`}>{selectedPath === asset.relativePath ? <Check className="h-4 w-4" /> : vi ? "Dùng" : "Use"}</Button>
      </div>)}
    </div>
    {ordered.length > 30 && !search ? <p className="text-[11px] text-muted-foreground">{vi ? "Hiển thị 30 file đầu. Tìm theo tên để xem các file khác." : "Showing 30 files. Search by name for older files."}</p> : null}
    {preview ? <audio key={preview.relativePath} controls autoPlay preload="metadata" src={preview.url} className="h-9 w-full" aria-label={`${vi ? "Nghe thử" : "Preview"} ${preview.fileName}`} /> : null}
  </div>;
}

function prioritizePresetVoices(audio: GeneratedAsset[], presetId: string, language: PresetVideoLanguage) {
  const prefix = `${presetId}-${language}-voiceover`;
  const otherLanguagePrefix = `${presetId}-${language === "vi" ? "en" : "vi"}-voiceover`;
  const rank = (asset: GeneratedAsset) => asset.fileName.startsWith(prefix) ? 0 : asset.fileName.startsWith(otherLanguagePrefix) ? 1 : 2;
  return [...audio].sort((a, b) => rank(a) - rank(b) || b.createdAtMs - a.createdAtMs);
}
