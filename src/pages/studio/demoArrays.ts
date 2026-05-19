import { ANIMAL_WEIGHT_VALUES, weightForValue } from "@/lib/animalColumns";

function randArr(n: number) {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 95) + 5);
}

function shuffle(values: number[]) {
  return [...values].sort(() => Math.random() - 0.5);
}

function randCountingArr(n: number) {
  const domainSize = Math.max(3, Math.min(8, Math.floor(Math.sqrt(n)) + 2));
  const values = Array.from({ length: domainSize }, (_, i) => i + 1);
  return shuffle(Array.from({ length: n }, (_, i) => {
    if (i < values.length) return values[i];
    return values[Math.floor(Math.random() * values.length)];
  }));
}

function shouldUseCountingDemo(arr: number[]) {
  if (!arr.length) return true;
  return new Set(arr).size > Math.max(8, Math.ceil(arr.length * 0.45));
}

function shouldUsePigeonholeDemo(arr: number[]) {
  if (!arr.length) return true;
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  return max - min + 1 > 18;
}

function randRadixArr(n: number) {
  const seeds = [-902, -170, -45, 2, 24, 66, 75, 170, 305, 802, 999];
  return Array.from({ length: n }, (_, i) => {
    if (i < seeds.length) return seeds[i];
    const sign = Math.random() < 0.22 ? -1 : 1;
    return sign * (Math.floor(Math.random() * 900) + 10);
  });
}

function randBucketArr(n: number) {
  const anchors = [8, 22, 45, 68, 91];
  return Array.from({ length: n }, (_, i) => {
    const anchor = anchors[i % anchors.length];
    return Math.max(1, Math.min(99, anchor + Math.floor(Math.random() * 15) - 7));
  });
}

function randTimArr(n: number) {
  const runSize = 8;
  const values = Array.from({ length: n }, (_, i) => i + 1);
  const runs: number[] = [];
  for (let start = 0; start < values.length; start += runSize) {
    const run = values.slice(start, start + runSize);
    if ((start / runSize) % 2 === 0) run.reverse();
    runs.push(...run);
  }
  return runs;
}

function randIntroArr(n: number) {
  return Array.from({ length: n }, (_, i) => n - i + Math.floor(Math.random() * 4));
}

function randOddEvenArr(n: number) {
  const values = Array.from({ length: n }, (_, i) => 10 + i * 6);
  for (let i = 1; i + 1 < values.length; i += 4) {
    [values[i], values[i + 1]] = [values[i + 1], values[i]];
  }
  for (let i = 0; i + 1 < values.length; i += 4) {
    [values[i], values[i + 1]] = [values[i + 1], values[i]];
  }
  return values;
}

function randPancakeArr(n: number) {
  const values = Array.from({ length: n }, (_, i) => 10 + i * 6);
  return shuffle(values).slice(0, Math.max(6, Math.min(n, 12)));
}

function randBitonicArr(n: number) {
  const values = Array.from({ length: n }, (_, i) => 10 + i * 5);
  return shuffle(values);
}

function randFlashArr(n: number) {
  const anchors = [6, 9, 12, 16, 19, 23, 27, 31, 35, 39, 44, 48, 52, 57, 61, 65, 70, 74, 79, 83, 88, 92, 96, 99];
  const values = Array.from({ length: n }, (_, i) => {
    const anchor = anchors[i % anchors.length];
    const wave = Math.floor(i / anchors.length) * 1.5;
    return Math.min(99, Math.round(anchor + wave));
  });
  return shuffle(values);
}

function randTreeSortArr(n: number) {
  const values = Array.from({ length: n }, (_, i) => 10 + i * 4);
  return shuffle(values);
}

function randCycleArr(n: number) {
  const base = [42, 18, 42, 7, 63, 18, 31, 55, 7, 70, 24, 31];
  return Array.from({ length: n }, (_, i) => base[i % base.length] + Math.floor(i / base.length) * 3);
}

function randPigeonholeArr(n: number) {
  const values = [12, 15, 12, 18, 10, 14, 18, 17, 10, 14, 15, 12];
  return Array.from({ length: n }, (_, i) => values[i % values.length]);
}

function randStrandArr(n: number) {
  const values = [32, 12, 18, 25, 9, 14, 28, 11, 19, 30, 7, 16, 22, 35, 10, 24];
  return Array.from({ length: n }, (_, i) => values[i % values.length]);
}

function randTournamentArr(n: number) {
  const values = [41, 13, 29, 7, 35, 18, 52, 24, 10, 46, 31, 16];
  return Array.from({ length: n }, (_, i) => values[i % values.length]);
}

function randSmoothArr(n: number) {
  const values = [8, 12, 16, 20, 24, 18, 22, 26, 30, 34, 28, 32, 36, 40, 44, 38];
  return Array.from({ length: n }, (_, i) => values[i % values.length]);
}

function randStoogeArr(n: number) {
  const values = [42, 7, 31, 15, 28, 3, 19, 11, 35];
  return Array.from({ length: n }, (_, i) => values[i % values.length]);
}

export function demoSizeForAlgorithm(algoId: string, currentSize: number) {
  if (algoId === "tim") return Math.max(currentSize, 40);
  if (algoId === "intro") return Math.max(currentSize, 32);
  if (algoId === "radix") return Math.max(currentSize, 18);
  if (algoId === "bucket") return Math.max(currentSize, 24);
  if (algoId === "odd_even") return Math.min(currentSize, 12);
  if (algoId === "pancake") return Math.min(currentSize, 12);
  if (algoId === "bitonic") return Math.min(currentSize, 32);
  if (algoId === "flash") return Math.min(Math.max(currentSize, 36), 48);
  if (algoId === "tree_sort") return Math.min(currentSize, 24);
  if (algoId === "cycle") return Math.min(currentSize, 18);
  if (algoId === "pigeonhole") return Math.min(currentSize, 16);
  if (algoId === "strand") return Math.min(currentSize, 16);
  if (algoId === "tournament") return Math.min(currentSize, 12);
  if (algoId === "smooth") return Math.min(currentSize, 16);
  if (algoId === "stooge") return Math.min(currentSize, 9);
  return currentSize;
}

export function maxDemoSizeForAlgorithm(algoId: string) {
  if (algoId === "tree_sort") return 24;
  if (algoId === "bitonic") return 32;
  if (algoId === "flash") return 48;
  if (algoId === "cycle") return 18;
  if (algoId === "pigeonhole") return 16;
  if (algoId === "strand") return 16;
  if (algoId === "tournament") return 12;
  if (algoId === "smooth") return 16;
  if (algoId === "stooge") return 9;
  if (algoId === "odd_even" || algoId === "pancake") return 12;
  return 500;
}

export function demoArrayForAlgorithm(algoId: string, n: number) {
  if (algoId === "counting") return randCountingArr(n);
  if (algoId === "radix") return shuffle(randRadixArr(n));
  if (algoId === "bucket") return shuffle(randBucketArr(n));
  if (algoId === "tim") return randTimArr(n);
  if (algoId === "intro") return randIntroArr(n);
  if (algoId === "odd_even") return randOddEvenArr(n);
  if (algoId === "pancake") return randPancakeArr(n);
  if (algoId === "bitonic") return randBitonicArr(n);
  if (algoId === "flash") return randFlashArr(n);
  if (algoId === "tree_sort") return randTreeSortArr(n);
  if (algoId === "cycle") return shuffle(randCycleArr(n));
  if (algoId === "pigeonhole") return shuffle(randPigeonholeArr(n));
  if (algoId === "strand") return randStrandArr(n);
  if (algoId === "tournament") return randTournamentArr(n);
  if (algoId === "smooth") return randSmoothArr(n);
  if (algoId === "stooge") return randStoogeArr(n);
  if (algoId === "heap") return shuffle(Array.from({ length: n }, (_, i) => Math.floor(15 + i * (85 / Math.max(1, n - 1)))));
  if (algoId === "cocktail" || algoId === "gnome") return shuffle(Array.from({ length: n }, (_, i) => (i % 7) * 7 + 10));
  return randArr(n);
}

export function demoAnimalArray(n: number) {
  const values = ANIMAL_WEIGHT_VALUES.length ? ANIMAL_WEIGHT_VALUES : Array.from({ length: 20 }, (_, i) => i + 1);
  const repeated = Array.from({ length: n }, (_, i) => values[i % values.length]);
  return shuffle(repeated);
}

export function normalizeAnimalArray(values: number[]) {
  return values.map((value) => weightForValue(value));
}

export function shouldUseAlgorithmDemo(algoId: string, arr: number[]) {
  if (!arr.length) return true;
  if (algoId === "counting") return shouldUseCountingDemo(arr);
  if (algoId === "tim") return arr.length < 40;
  if (algoId === "intro") return arr.length < 24;
  if (algoId === "odd_even") return arr.length > 14;
  if (algoId === "pancake") return arr.length > 14;
  if (algoId === "bitonic") return arr.length > 32;
  if (algoId === "flash") return arr.length < 30 || arr.length > 48 || new Set(arr).size < Math.min(10, arr.length);
  if (algoId === "tree_sort") return arr.length > 24;
  if (algoId === "cycle") return arr.length > 18;
  if (algoId === "pigeonhole") return arr.length > 16 || shouldUsePigeonholeDemo(arr);
  if (algoId === "strand") return arr.length > 16;
  if (algoId === "tournament") return arr.length > 12;
  if (algoId === "smooth") return arr.length > 16;
  if (algoId === "stooge") return arr.length > 9;
  if (algoId === "radix") return !arr.some((n) => Math.abs(n) >= 100) || !arr.some((n) => n < 0);
  if (algoId === "bucket") return arr.length < 20 || new Set(arr.map((n) => Math.floor(n / 20))).size < 3;
  return false;
}

export function parseInputArray(input: string) {
  return input.trim().split(/[,\s]+/).map((s) => parseInt(s, 10)).filter((n) => !Number.isNaN(n));
}
