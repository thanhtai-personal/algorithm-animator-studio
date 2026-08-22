import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { StoredProject } from "../types";

export function RhythmicProjectsDialog({ open, onOpenChange, projects, onLoad, onDelete }: { open: boolean; onOpenChange: (open: boolean) => void; projects: StoredProject[]; onLoad: (project: StoredProject) => void; onDelete: (id: string) => void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Saved rhythmic projects</DialogTitle><DialogDescription>Preset settings are stored locally in KAI Studio. Imported MIDI/audio files must be re-selected after reopening.</DialogDescription></DialogHeader><div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
    {projects.length === 0 ? <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No rhythmic presets yet.</div> : projects.map((project) => <div key={project.id} className="flex items-center gap-2 rounded-xl border bg-card/60 p-2"><button className="min-w-0 flex-1 rounded-lg p-2 text-left hover:bg-muted/50" onClick={() => { onLoad(project); onOpenChange(false); }}><p className="truncate text-sm font-semibold">{project.name}</p><p className="truncate text-xs text-muted-foreground">{project.source?.name ?? "No source"} · {new Date(project.updatedAt).toLocaleString()}</p></button><Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(project.id)}><Trash2 className="h-4 w-4" /></Button></div>)}
  </div></DialogContent></Dialog>;
}
