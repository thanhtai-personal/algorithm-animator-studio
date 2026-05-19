import { snap } from "../frame";
import type { AlgoDef, Frame, TournamentNode } from "../types";

type Item = TournamentNode;

export const tournamentSort: AlgoDef = {
  id: "tournament",
  name: "Tournament Sort",
  category: "sort",
  code: `let active = arr.map((value, index) => ({ value, index }));
let output = [];
while (active.length) {
  let round = active;
  while (round.length > 1) {
    const next = [];
    for (let i = 0; i < round.length; i += 2) {
      if (i + 1 === round.length) next.push(round[i]);
      else next.push(round[i].value <= round[i + 1].value ? round[i] : round[i + 1]);
    }
    round = next;
  }
  output.push(round[0].value);
  active = active.filter((item) => item !== round[0]);
}`,
  run(arr) {
    const active: Item[] = arr.map((value, sourceIndex) => ({ id: sourceIndex + 1, value, sourceIndex }));
    const output: number[] = [];
    const frames: Frame[] = [];
    const sorted = new Set<number>();
    const v: Record<string, number | string> = { kind: "tournament", phase: "build", outputSize: 0 };

    const visible = () => [...output, ...active.map((item) => item.value)];
    const state = (rounds: Item[][], phase: NonNullable<Frame["tournament"]>["phase"], activeIds: number[] = [], winnerId?: number) => ({
      tournament: {
        rounds: rounds.map((round) => round.map((item) => ({ ...item }))),
        activeIds,
        winnerId,
        output: [...output],
        phase,
      },
    });
    const visibleIndex = (item: Item) => output.length + active.findIndex((candidate) => candidate.id === item.id);

    frames.push(snap(visible(), 0, v, sorted, [], [], null, state([active], "build")));

    while (active.length) {
      v.phase = "build tournament"; v.outputSize = output.length; v.activeSize = active.length;
      let rounds: Item[][] = [[...active]];
      frames.push(snap(visible(), 2, v, sorted, [], [], null, { event: "visit", ...state(rounds, "build") }));

      let current = [...active];
      while (current.length > 1) {
        const next: Item[] = [];
        for (let i = 0; i < current.length; i += 2) {
          const left = current[i];
          const right = current[i + 1];
          if (!right) {
            next.push(left);
            v.phase = "bye"; v.value = left.value; v.round = rounds.length - 1;
            frames.push(snap(visible(), 5, v, sorted, [visibleIndex(left)], [], null, {
              event: "visit",
              ...state([...rounds, [...next]], "promote", [left.id], left.id),
            }));
            continue;
          }

          v.phase = "compare match"; v.left = left.value; v.right = right.value; v.round = rounds.length - 1;
          frames.push(snap(visible(), 7, v, sorted, [visibleIndex(left), visibleIndex(right)], [], null, {
            event: "compare",
            ...state([...rounds, [...next]], "compare", [left.id, right.id]),
          }));

          const winner = left.value <= right.value ? left : right;
          next.push(winner);
          v.phase = "winner advances"; v.value = winner.value; v.winner = winner.value;
          frames.push(snap(visible(), 8, v, sorted, [visibleIndex(winner)], [visibleIndex(winner)], null, {
            event: "found",
            ...state([...rounds, [...next]], "promote", [left.id, right.id], winner.id),
          }));
        }
        current = next;
        rounds = [...rounds, [...current]];
      }

      const winner = current[0];
      v.phase = "extract min"; v.value = winner.value; v.winner = winner.value;
      frames.push(snap(visible(), 12, v, sorted, [visibleIndex(winner)], [visibleIndex(winner)], null, {
        event: "found",
        ...state(rounds, "extract", [winner.id], winner.id),
      }));

      output.push(winner.value);
      active.splice(active.findIndex((item) => item.id === winner.id), 1);
      for (let i = 0; i < output.length; i++) sorted.add(i);
      v.phase = "write output"; v.outputSize = output.length;
      frames.push(snap(visible(), 13, v, sorted, [output.length - 1], [output.length - 1], null, {
        event: "swap",
        ...state(rounds, "extract", [], winner.id),
      }));
    }

    v.phase = "done";
    frames.push(snap([...output], 15, v, sorted, [], [], null, state([], "done")));
    return frames;
  },
};
