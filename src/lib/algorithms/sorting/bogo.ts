import { snap } from "../frame";
import type { AlgoDef, Frame } from "../types";

export const bogoSort: AlgoDef = {
  id: "bogo",
  name: "Bogo Sort",
  category: "sort",
  code: `while (!isSorted(arr)) {
  shuffle(arr);
}

function isSorted(arr) {
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] > arr[i + 1]) return false;
  }
  return true;
}`,
  run(arr) {
    const a = [...arr];
    const frames: Frame[] = [];
    const sorted = new Set<number>();
    const v: Record<string, number | string> = {
      kind: "bogo",
      phase: "start",
      attempt: 0,
      chance: chanceLabel(a.length),
      strategy: "none",
    };
    const maxAttempts = Math.max(5, Math.min(10, a.length + 3));
    const sortedTarget = [...a].sort((left, right) => left - right);

    const emit = (
      line: number,
      highlight: number[] = [],
      swap: number[] = [],
      event: Frame["event"] = null,
    ) => {
      frames.push(snap(a, line, v, sorted, highlight, swap, null, { event }));
    };

    emit(0);

    let attempt = 0;
    while (!isSorted(a) && attempt < maxAttempts) {
      attempt += 1;
      v.attempt = attempt;
      v.phase = attempt === maxAttempts ? "lucky shuffle" : "shuffle";
      v.strategy = "random reset";
      v.shuffleStep = 0;

      if (attempt === maxAttempts) {
        shuffleIntoTarget(a, sortedTarget, (left, right, step) => {
          v.shuffleStep = step;
          v.i = left;
          v.j = right;
          emit(1, [left, right], [left, right], "swap");
        });
      } else {
        shuffleDeterministic(a, attempt, (left, right, step) => {
          v.shuffleStep = step;
          v.i = left;
          v.j = right;
          emit(1, [left, right], [left, right], "swap");
        });
      }

      if (Number(v.shuffleStep) === 0) {
        emit(1, allIndexes(a), [], null);
      }

      v.phase = "check sorted";
      v.strategy = "scan only";
      let sortedThisAttempt = true;
      for (let i = 0; i < a.length - 1; i++) {
        v.i = i;
        v.j = i + 1;
        emit(6, [i, i + 1], [], "compare");
        if (a[i] > a[i + 1]) {
          sortedThisAttempt = false;
          v.phase = "failed check";
          v.strategy = "throw away order";
          emit(7, [i, i + 1], [], null);
          break;
        }
      }

      if (sortedThisAttempt) break;
    }

    for (let i = 0; i < a.length; i++) sorted.add(i);
    v.phase = "done by chance";
    v.strategy = "luck won";
    v.attempt = attempt;
    emit(10);
    return frames;
  },
};

function isSorted(values: number[]) {
  for (let i = 0; i < values.length - 1; i++) {
    if (values[i] > values[i + 1]) return false;
  }
  return true;
}

function shuffleDeterministic(values: number[], seed: number, onSwap: (left: number, right: number, step: number) => void) {
  let state = seed * 1103515245 + 12345;
  let step = 0;
  for (let i = values.length - 1; i > 0; i--) {
    state = (state * 1103515245 + 12345) >>> 0;
    const j = state % (i + 1);
    if (i === j) continue;
    [values[i], values[j]] = [values[j], values[i]];
    step += 1;
    onSwap(i, j, step);
  }
}

function shuffleIntoTarget(values: number[], target: number[], onSwap: (left: number, right: number, step: number) => void) {
  let step = 0;
  for (let i = 0; i < values.length; i++) {
    if (values[i] === target[i]) continue;
    const j = values.findIndex((value, index) => index > i && value === target[i]);
    if (j < 0) continue;
    [values[i], values[j]] = [values[j], values[i]];
    step += 1;
    onSwap(i, j, step);
  }
}

function allIndexes(values: number[]) {
  return Array.from({ length: values.length }, (_, index) => index);
}

function chanceLabel(length: number) {
  const n = Math.max(1, length);
  if (n > 7) return `1/${n}!`;
  let factorial = 1;
  for (let i = 2; i <= n; i++) factorial *= i;
  return `1/${factorial}`;
}
