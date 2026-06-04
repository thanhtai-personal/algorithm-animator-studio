import { FolderOpen, Plus, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type VoiceRow = { id: string; label: string };

type PathInputProps = {
  id: string;
  label: string;
  description: string;
  value: string;
  placeholder: string;
  busy: boolean;
  onChange: (value: string) => void;
  onSelect: () => void;
  onOpen: () => void;
};

export function PathInput({ id, label, description, value, placeholder, busy, onChange, onSelect, onOpen }: PathInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="flex flex-col gap-2 md:flex-row">
        <Input id={id} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
        <Button type="button" variant="outline" onClick={onSelect} disabled={busy}>
          <Search className="mr-2 h-4 w-4" /> Chọn
        </Button>
        <Button type="button" variant="ghost" onClick={onOpen} disabled={!value.trim()}>
          <FolderOpen className="mr-2 h-4 w-4" /> Mở
        </Button>
      </div>
    </div>
  );
}

export function SecretInput(props: { id: string; label: string; description: string; value: string; placeholder: string; type?: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id}>{props.label}</Label>
      <p className="text-sm text-muted-foreground">{props.description}</p>
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
  onAdd: () => void;
  onUpdate: (index: number, patch: Partial<VoiceRow>) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Label>ELEVENLABS_VOICES</Label>
          <p className="mt-1 text-sm text-muted-foreground">Khai báo các voice sẽ xuất hiện trong dropdown ElevenLabs.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={props.onAdd}>
          <Plus className="mr-2 h-4 w-4" /> Thêm voice
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Voice ID</TableHead>
              <TableHead>Label</TableHead>
              <TableHead className="w-20 text-right">Xóa</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.rows.length ? props.rows.map((row, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Input value={row.id} placeholder="VOICE_ID" onChange={(event) => props.onUpdate(index, { id: event.target.value })} />
                </TableCell>
                <TableCell>
                  <Input value={row.label} placeholder="Giọng đọc chính" onChange={(event) => props.onUpdate(index, { label: event.target.value })} />
                </TableCell>
                <TableCell className="text-right">
                  <Button type="button" variant="ghost" size="icon" onClick={() => props.onRemove(index)} aria-label="Xóa voice">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">Chưa có voice. Bấm Thêm voice để nhập Voice ID.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function StatusTile({ label, ok, value }: { label: string; ok: boolean; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="font-medium">{label}</p>
        <Badge variant={ok ? "default" : "secondary"}>{ok ? "OK" : "Check"}</Badge>
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
