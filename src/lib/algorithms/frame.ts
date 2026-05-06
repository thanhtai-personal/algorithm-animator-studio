import type { Frame } from "./types";

export const snap = (
  arr: number[],
  line: number,
  vars: Record<string, number | string>,
  sorted: Set<number>,
  highlight: number[] = [],
  swap: number[] = [],
  pivot: number | null = null,
  extra: Partial<Frame> = {},
): Frame => ({
  arr: [...arr],
  highlight,
  swap,
  sorted: [...sorted],
  pivot,
  line,
  vars: { ...vars },
  event: null,
  ...extra,
});
