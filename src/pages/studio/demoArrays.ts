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

export function demoSizeForAlgorithm(algoId: string, currentSize: number) {
  if (algoId === "tim") return Math.max(currentSize, 40);
  if (algoId === "intro") return Math.max(currentSize, 32);
  if (algoId === "radix") return Math.max(currentSize, 18);
  if (algoId === "bucket") return Math.max(currentSize, 24);
  return currentSize;
}

export function demoArrayForAlgorithm(algoId: string, n: number) {
  if (algoId === "counting") return randCountingArr(n);
  if (algoId === "radix") return shuffle(randRadixArr(n));
  if (algoId === "bucket") return shuffle(randBucketArr(n));
  if (algoId === "tim") return randTimArr(n);
  if (algoId === "intro") return randIntroArr(n);
  if (algoId === "heap") return shuffle(Array.from({ length: n }, (_, i) => Math.floor(15 + i * (85 / Math.max(1, n - 1)))));
  if (algoId === "cocktail" || algoId === "gnome") return shuffle(Array.from({ length: n }, (_, i) => (i % 7) * 7 + 10));
  return randArr(n);
}

export function shouldUseAlgorithmDemo(algoId: string, arr: number[]) {
  if (!arr.length) return true;
  if (algoId === "counting") return shouldUseCountingDemo(arr);
  if (algoId === "tim") return arr.length < 40;
  if (algoId === "intro") return arr.length < 24;
  if (algoId === "radix") return !arr.some((n) => Math.abs(n) >= 100) || !arr.some((n) => n < 0);
  if (algoId === "bucket") return arr.length < 20 || new Set(arr.map((n) => Math.floor(n / 20))).size < 3;
  return false;
}

export function parseInputArray(input: string) {
  return input.trim().split(/[,\s]+/).map((s) => parseInt(s, 10)).filter((n) => !Number.isNaN(n));
}
