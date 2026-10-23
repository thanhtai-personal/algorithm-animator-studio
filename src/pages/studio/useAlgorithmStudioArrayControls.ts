import type { Dispatch, SetStateAction } from "react";
import type { ColumnVisualMode } from "@/lib/animalColumns";
import { demoAnimalArray, demoArrayForAlgorithm, demoSizeForAlgorithm, normalizeAnimalArray, parseInputArray } from "./demoArrays";

const DEFAULT_ANIMAL_ARRAY_SIZE = 14;

type Params = {
  requireConfigAccess: () => boolean;
  input: string;
  arr: number[];
  size: number;
  columnVisualMode: ColumnVisualMode;
  algoId: string;
  setSizeState: Dispatch<SetStateAction<number>>;
  setArr: Dispatch<SetStateAction<number[]>>;
  setInput: Dispatch<SetStateAction<string>>;
  setFrameIdx: Dispatch<SetStateAction<number>>;
  setTransitionProgress: Dispatch<SetStateAction<number>>;
  setPlaying: Dispatch<SetStateAction<boolean>>;
  setColumnVisualMode: Dispatch<SetStateAction<ColumnVisualMode>>;
};

export function useAlgorithmStudioArrayControls(params: Params) {
  const resetPlayback = () => {
    params.setFrameIdx(0);
    params.setTransitionProgress(1);
    params.setPlaying(false);
  };

  const newArray = () => {
    if (!params.requireConfigAccess()) return;
    const trimmed = params.input.trim();
    const inputMatchesCurrentArray = trimmed === params.arr.join(", ");
    let next = params.columnVisualMode === "animal" ? demoAnimalArray(params.size) : trimmed && !inputMatchesCurrentArray
      ? parseInputArray(params.input)
      : demoArrayForAlgorithm(params.algoId, params.size);
    if (params.columnVisualMode === "animal") next = normalizeAnimalArray(next);
    if (!next.length) next = params.columnVisualMode === "animal" ? demoAnimalArray(params.size) : demoArrayForAlgorithm(params.algoId, params.size);
    params.setSizeState(next.length);
    params.setArr(next);
    params.setInput(next.join(", "));
    resetPlayback();
  };

  const setSize = (nextSize: number) => {
    if (!params.requireConfigAccess()) return;
    const effectiveSize = demoSizeForAlgorithm(params.algoId, nextSize);
    params.setSizeState(effectiveSize);
    const next = params.columnVisualMode === "animal" ? demoAnimalArray(effectiveSize) : demoArrayForAlgorithm(params.algoId, effectiveSize);
    params.setArr(next);
    params.setInput(next.join(", "));
    resetPlayback();
  };

  const setColumnVisualModeWithDefaults = (value: ColumnVisualMode) => {
    if (!params.requireConfigAccess()) return;
    params.setColumnVisualMode(value);
    if (value !== "animal") return;
    const next = demoAnimalArray(DEFAULT_ANIMAL_ARRAY_SIZE);
    params.setSizeState(DEFAULT_ANIMAL_ARRAY_SIZE);
    params.setArr(next);
    params.setInput(next.join(", "));
    resetPlayback();
  };

  return { newArray, setSize, setColumnVisualModeWithDefaults };
}
