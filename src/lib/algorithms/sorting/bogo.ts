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
    };
    const maxAttempts = Math.max(8, Math.min(48, a.length * 6));
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

      if (attempt === maxAttempts) {
        for (let i = 0; i < a.length; i++) a[i] = sortedTarget[i];
        emit(1, allIndexes(a), allIndexes(a), "swap");
      } else {
        shuffleDeterministic(a, attempt);
        emit(1, allIndexes(a), allIndexes(a), "swap");
      }

      v.phase = "check sorted";
      let sortedThisAttempt = true;
      for (let i = 0; i < a.length - 1; i++) {
        v.i = i;
        v.j = i + 1;
        emit(6, [i, i + 1], [], "compare");
        if (a[i] > a[i + 1]) {
          sortedThisAttempt = false;
          v.phase = "not sorted";
          emit(7, [i, i + 1], [], null);
          break;
        }
      }

      if (sortedThisAttempt) break;
    }

    for (let i = 0; i < a.length; i++) sorted.add(i);
    v.phase = "done";
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

function shuffleDeterministic(values: number[], seed: number) {
  let state = seed * 1103515245 + 12345;
  for (let i = values.length - 1; i > 0; i--) {
    state = (state * 1103515245 + 12345) >>> 0;
    const j = state % (i + 1);
    [values[i], values[j]] = [values[j], values[i]];
  }
}

function allIndexes(values: number[]) {
  return Array.from({ length: values.length }, (_, index) => index);
}
