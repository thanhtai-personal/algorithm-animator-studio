import type { Frame } from "@/lib/algorithms";
import type { Theme } from "@/lib/renderer";

export type BarMotion = {
  index: number;
  value: number;
  fromIndex: number;
  targetIndex: number;
  color: string;
  emissive: string;
  emphasized: boolean;
};

export function getBarMotion(frame: Frame, previousFrame: Frame | null | undefined, theme: Theme): BarMotion[] {
  const swapPair = getSwapPair(frame, previousFrame);
  return frame.arr.map((value, index) => {
    let fromIndex = index;
    if (swapPair) {
      if (index === swapPair[0]) fromIndex = swapPair[1];
      else if (index === swapPair[1]) fromIndex = swapPair[0];
    }
    const state = barState(frame, index, theme);
    return { index, value, fromIndex, targetIndex: index, ...state };
  });
}

export function barState(frame: Frame, index: number, theme: Theme) {
  if (frame.pivot === index) return { color: theme.pivot, emissive: theme.pivot, emphasized: true };
  if (frame.swap.includes(index)) return { color: theme.swap, emissive: theme.swap, emphasized: true };
  if (frame.highlight.includes(index)) return { color: theme.highlight, emissive: theme.highlight, emphasized: true };
  if (frame.sorted.includes(index)) return { color: theme.sorted, emissive: theme.sorted, emphasized: false };
  return { color: theme.bar, emissive: theme.bar, emphasized: false };
}

export function arrayLayout(values: number[]) {
  const count = Math.max(1, values.length);
  const min = Math.min(0, ...values);
  const max = Math.max(1, ...values);
  const range = Math.max(1, max - min);
  const span = Math.min(20, Math.max(8, count * 0.82));
  const step = span / count;
  const width = Math.max(0.22, step * 0.68);
  const maxHeight = 8.2;
  const heightFor = (value: number) => Math.max(0.28, ((value - min) / range) * (maxHeight - 0.4) + 0.4);
  const xFor = (index: number) => -span / 2 + step * (index + 0.5);
  return { count, min, max, range, span, step, width, maxHeight, heightFor, xFor };
}

export function getSwapPair(frame: Frame, previousFrame: Frame | null | undefined): [number, number] | null {
  if (!previousFrame || frame.event !== "swap" || frame.swap.length !== 2) return null;
  const [a, b] = frame.swap;
  if (a < 0 || b < 0 || a >= frame.arr.length || b >= frame.arr.length) return null;
  if (previousFrame.arr.length !== frame.arr.length) return null;
  if (previousFrame.arr[a] !== frame.arr[b] || previousFrame.arr[b] !== frame.arr[a]) return null;
  return [a, b];
}

export function graphNodePosition(node: { x: number; y: number }) {
  return {
    x: (node.x - 0.5) * 13.5,
    y: 1.15,
    z: (node.y - 0.5) * 10.5,
  };
}

export function eventLabel(frame: Frame | null | undefined) {
  if (!frame) return "READY";
  if (frame.event === "swap") return "SWAP";
  if (frame.event === "compare") return "COMPARE";
  if (frame.event === "visit") return "VISIT";
  if (frame.event === "found") return "FOUND";
  if (frame.event) return String(frame.event).toUpperCase();
  return "STEP";
}
