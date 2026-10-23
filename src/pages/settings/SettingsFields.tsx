import { CircleCheck, FolderOpen, Plus, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {uiText, t, type Lang} from "@/lib/i18n";

export type VoiceRow = { id: string; label: string };

type PathInputProps = {
  id: string;
  label: string;
  description?: string;
  value: string;
  placeholder: string;
  busy: boolean;
  lang: Lang;
  onChange: (value: string) => void;
  onSelect: () => void;
  onOpen: () => void;
};

export function PathInput({ id, label, value, placeholder, busy, lang, onChange, onSelect, onOpen }: PathInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex flex-col gap-2 md:flex-row">
        <Input id={id} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
        <Button type="button" variant="outline" onClick={onSelect} disabled={busy}>
          <Search className="mr-2 h-4 w-4" /> {t(lang, "settingsSelect")}
        </Button>
        <Button type="button" variant="ghost" onClick={onOpen} disabled={!value.trim()}>
          <FolderOpen className="mr-2 h-4 w-4" /> {t(lang, "settingsOpen")}
        </Button>
      </div>
    </div>
  );
}

export function SecretInput(props: { id: string; label: string; description: string; value: string; placeholder: string; type?: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id}>{props.label}</Label>
      <Input
        id={props.id}
        type={props.type ?? "password"}
        autoComplete="off"
        value={props.value}
        placeholder={props.placeholder}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </div>
  );
}

export function VoiceRowsTable(props: {
  rows: VoiceRow[];
  lang: Lang;
  onAdd: () => void;
  onUpdate: (index: number, patch: Partial<VoiceRow>) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Label>{t(props.lang, "settingsElevenLabsVoicesLabel")}</Label>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={props.onAdd}>
          <Plus className="mr-2 h-4 w-4" /> {t(props.lang, "settingsAddVoice")}
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{uiText("Voice ID")}</TableHead>
              <TableHead>{uiText("Label")}</TableHead>
              <TableHead className="w-20 text-right">{t(props.lang, "settingsRemove")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.rows.length ? props.rows.map((row, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Input value={row.id} placeholder="VOICE_ID" onChange={(event) => props.onUpdate(index, { id: event.target.value })} />
                </TableCell>
                <TableCell>
                  <Input value={row.label} placeholder={t(props.lang, "settingsMainVoice")} onChange={(event) => props.onUpdate(index, { label: event.target.value })} />
                </TableCell>
                <TableCell className="text-right">
                  <Button type="button" variant="ghost" size="icon" onClick={() => props.onRemove(index)} aria-label={t(props.lang, "settingsRemoveVoice")}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">{t(props.lang, "settingsNoVoices")}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function StatusTile({ label, ok, value, lang }: { label: string; ok: boolean; value: string; lang: Lang }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="font-medium">{label}</p>
        {ok ? (
          <Badge className="bg-emerald-600/15 px-2 text-emerald-700 hover:bg-emerald-600/20 dark:text-emerald-300" aria-label={t(lang, "settingsReady")}>
            <CircleCheck className="h-4 w-4" />
          </Badge>
        ) : (
          <Badge variant="secondary">{t(lang, "settingsCheck")}</Badge>
        )}
      </div>
      <p className="break-all text-sm text-muted-foreground">{value}</p>
    </div>
  );
}

export function parseVoiceRows(value?: string): VoiceRow[] {
  if (!value?.trim()) return [];
  try {
    const rows = JSON.parse(value) as Array<Partial<VoiceRow>>;
    return Array.isArray(rows)
      ? rows.map((row) => ({ id: String(row.id || ""), label: String(row.label || "") })).filter((row) => row.id || row.label)
      : [];
  } catch {
    return [];
  }
}

export function serializeVoiceRows(rows: VoiceRow[]) {
  const voices = rows
    .map((row) => ({ id: row.id.trim(), label: row.label.trim() || row.id.trim() }))
    .filter((row) => row.id);
  return voices.length ? JSON.stringify(voices) : "";
}
