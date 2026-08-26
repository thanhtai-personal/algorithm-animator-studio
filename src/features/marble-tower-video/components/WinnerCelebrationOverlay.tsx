import { Crown, Trophy } from "lucide-react";
import { marbleById } from "../marble/marbleCatalog";
import type { RaceResult } from "../race/raceTypes";

export function WinnerCelebrationOverlay({ result }: { result: RaceResult | null }) {
  if (!result) return null;
  const winner = marbleById(result.winnerId);

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden bg-black/25 backdrop-blur-[1px]">
      <style>{`
        @keyframes marble-champion-pop { 0% { opacity: 0; transform: translate(-50%, -46%) scale(.45) rotate(-5deg); } 68% { opacity: 1; transform: translate(-50%, -50%) scale(1.08) rotate(1deg); } 100% { transform: translate(-50%, -50%) scale(1) rotate(0); } }
        @keyframes marble-confetti-fall { 0% { transform: translate3d(0,-12vh,0) rotate(0deg); opacity: 0; } 12% { opacity: 1; } 100% { transform: translate3d(54px,112vh,0) rotate(760deg); opacity: .92; } }
        @keyframes marble-winner-glow { from { transform: scale(.96); filter: brightness(.98); } to { transform: scale(1.04); filter: brightness(1.18); } }
      `}</style>
      {Array.from({ length: 42 }, (_, index) => (
        <i
          key={index}
          className="absolute -top-8 h-4 w-2 rounded-sm"
          style={{
            left: `${(index * 37) % 100}%`,
            background: `hsl(${(index * 47) % 360} 90% 60%)`,
            animation: `marble-confetti-fall ${2.4 + (index % 8) * 0.16}s linear ${(index % 10) * -0.2}s infinite`,
          }}
        />
      ))}

      <div
        className="absolute left-1/2 top-1/2 flex min-w-[300px] flex-col items-center rounded-3xl border border-white/35 bg-black/70 px-8 py-7 text-center text-white shadow-[0_24px_80px_rgba(0,0,0,.65)]"
        style={{ animation: "marble-champion-pop .7s cubic-bezier(.18,.89,.32,1.28) both" }}
      >
        <Crown className="mb-1 h-10 w-10 text-yellow-300" />
        <div className="text-xs font-black uppercase tracking-[0.34em] text-yellow-200">Champion</div>
        <div
          className="relative my-4 h-28 w-28 overflow-hidden rounded-full border-4 border-white/80 shadow-[inset_-18px_-20px_28px_rgba(0,0,0,.38),0_0_45px_rgba(255,255,255,.35)]"
          style={{
            background: `radial-gradient(circle at 31% 24%, white 0 7%, ${winner.color} 19%, color-mix(in srgb, ${winner.color}, #000 46%) 78%)`,
            animation: "marble-winner-glow .75s ease-in-out infinite alternate",
          }}
        >
          {winner.stripeColor ? <span className="absolute -left-4 top-[44%] h-4 w-36 -rotate-12" style={{ background: winner.stripeColor }} /> : null}
        </div>
        <div className="flex items-center gap-2 text-3xl font-black uppercase tracking-tight">
          <Trophy className="h-7 w-7 text-yellow-300" />
          {winner.name}
        </div>
        <div className="mt-2 text-sm font-bold uppercase tracking-[0.18em] text-white/80">Winner · {(result.timeMs / 1000).toFixed(2)}s</div>
      </div>
    </div>
  );
}
