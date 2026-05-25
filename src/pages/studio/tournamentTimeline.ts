import type {
  AlgoDef,
  AlgorithmWorldAlgorithmId,
  AlgorithmWorldScenarioOptions,
  AlgorithmWorldTournamentResults,
  AlgorithmWorldTournamentRound,
  Frame,
} from "@/lib/algorithms";
import { maxTournamentMatches, normalizeTournamentEntrants, tournamentResultKey } from "@/lib/algorithmWorldTournament";

type RunOptions = NonNullable<Parameters<AlgoDef["run"]>[1]>;

export type WorldTournamentTimeline = {
  frames: Frame[];
  results: AlgorithmWorldTournamentResults;
};

export function buildWorldTournamentTimeline(params: {
  run: AlgoDef["run"];
  arr: number[];
  runOptions: RunOptions;
  worldScenario: AlgorithmWorldScenarioOptions;
}): WorldTournamentTimeline {
  const entrants = normalizeTournamentEntrants(params.worldScenario.tournamentEntrants);
  const results: AlgorithmWorldTournamentResults = {};
  const frames: Frame[] = [];

  for (const round of [0, 1, 2] as AlgorithmWorldTournamentRound[]) {
    for (let match = 0; match < maxTournamentMatches(round); match++) {
      const matchFrames = params.run(params.arr, {
        ...params.runOptions,
        worldScenario: {
          ...params.worldScenario,
          videoMode: "long",
          compareEnabled: true,
          presentationMode: "vehicle_race",
          mazeId: "random",
          tournamentEnabled: true,
          tournamentRound: round,
          tournamentMatch: match,
          tournamentResults: results,
          tournamentEntrants: entrants,
        },
      });

      frames.push(...matchFrames);
      const winner = findTournamentWinner(matchFrames);
      if (winner) results[tournamentResultKey(round, match)] = winner;
    }
  }

  return { frames, results };
}

export function findTournamentWinner(frames: Frame[]): AlgorithmWorldAlgorithmId | undefined {
  for (let index = frames.length - 1; index >= 0; index--) {
    const intro = frames[index]?.worldCompare?.raceIntro;
    if (intro?.stage === "bracket" && intro.winnerAlgorithm) return intro.winnerAlgorithm;
  }
  return undefined;
}
