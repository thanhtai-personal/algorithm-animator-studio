import type { MarbleId } from "../marble/marbleCatalog";
import type { RaceSnapshot } from "../race/raceTypes";
import type { RaceCourseDefinition } from "../track/raceCourse";
import type { MarbleRuntime } from "./physicsTypes";

export function buildRaceSnapshot(
  ranked: MarbleRuntime[],
  course: RaceCourseDefinition,
  resolvedCuts: ReadonlySet<number>,
  opened: boolean,
  completed: boolean,
  totalTime: number,
  raceTime: number,
  winnerId: MarbleId | null,
  pianoCombo: number,
): RaceSnapshot {
  const leader = ranked.find((marble) => marble.alive) ?? null;
  const denominator = course.samples.length - 1;
  const leaderProgress = leader ? leader.progressIndex / denominator : 0;
  const section = course.samples[Math.round(leaderProgress * denominator)]?.section.label ?? "FINISH";
  const nextCut = course.cuts.find((_, index) => !resolvedCuts.has(index));
  return {
    phase: completed ? "finished" : opened ? "racing" : "countdown",
    countdown: opened ? 0 : Math.max(0, Math.ceil(3 - totalTime)),
    elapsedMs: Math.round(raceTime * 1000),
    leaderId: leader?.id ?? winnerId,
    alive: ranked.filter((marble) => marble.alive).length,
    speed: leader?.body.velocity.length() ?? 0,
    nextCut: nextCut?.label ?? section,
    pianoCombo,
    standings: ranked.map((marble, index) => ({
      id: marble.id,
      position: marble.alive ? index + 1 : marble.finalPosition ?? index + 1,
      alive: marble.alive,
      progress: marble.progressIndex / denominator,
    })),
  };
}
