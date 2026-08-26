import { observer } from "mobx-react-lite";
import { Gauge, Trophy, Users } from "lucide-react";
import { MARBLES, marbleById } from "../marble/marbleCatalog";
import type { RaceResult } from "../race/raceTypes";
import { raceSessionStore } from "../store/RaceSessionStore";

export const RaceHudPanel = observer(function RaceHudPanel({ result }: { result?: RaceResult | null }) {
  const leader = raceSessionStore.leaderId ? marbleById(raceSessionStore.leaderId) : null;
  const winner = result ? marbleById(result.winnerId) : null;
  const focus = winner ?? leader;

  return <div className="grid gap-3 xl:grid-cols-[1fr_1.35fr]">
    <div className="rounded-xl border bg-card/60 p-3">
      <div className="flex items-center gap-3">
        <span className="h-8 w-8 rounded-full border-2 border-white/70 shadow-lg" style={{ background: focus?.color ?? "#64748b" }} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{winner ? `${winner.name} WINS` : focus ? `${focus.name} LEADS` : "TOWER RACE"}</p>
          <p className="text-xs text-muted-foreground">{result ? `FINISH · ${(result.timeMs / 1000).toFixed(2)}s` : raceSessionStore.callout}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs"><Metric icon={Gauge} label="Leader speed" value={`${raceSessionStore.speed.toFixed(1)} m/s`} /><Metric icon={Users} label="Alive" value={String(raceSessionStore.alive)} /><Metric icon={Trophy} label="Next" value={raceSessionStore.nextCut} /></div>
    </div>
    <div className="rounded-xl border bg-card/60 p-3">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Live ranking</p>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 xl:grid-cols-8">{raceSessionStore.standings.map((standing) => {
        const marble = MARBLES.find((item) => item.id === standing.id)!;
        const isLeader = standing.id === raceSessionStore.leaderId && standing.alive;
        return <div key={standing.id} className={`rounded-lg border px-2 py-1.5 text-xs ${isLeader ? "border-primary bg-primary/10" : "bg-background/35"} ${standing.alive ? "" : "opacity-45"}`}><div className="flex items-center gap-1.5"><b>{standing.position}</b><span className="h-2.5 w-2.5 rounded-full" style={{ background: marble.color }} /></div><div className="mt-0.5 truncate text-[10px] text-muted-foreground">{standing.alive ? marble.name : "OUT"}</div></div>;
      })}</div>
    </div>
  </div>;
});

function Metric({ icon: Icon, label, value }: { icon: typeof Gauge; label: string; value: string }) {
  return <div className="rounded-lg bg-muted/45 p-2"><Icon className="mb-1 h-3.5 w-3.5 text-primary" /><p className="text-[10px] uppercase text-muted-foreground">{label}</p><p className="truncate font-semibold">{value}</p></div>;
}
