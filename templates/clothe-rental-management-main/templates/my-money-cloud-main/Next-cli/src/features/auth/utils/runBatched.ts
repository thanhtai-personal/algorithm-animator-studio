export async function runBatched<T>(
  items: T[],
  batchSize: number,
  worker: (item: T) => Promise<void>,
  onBatchComplete?: (count: number) => void
): Promise<void> {
  const safeBatchSize = Math.max(1, batchSize);
  for (let index = 0; index < items.length; index += safeBatchSize) {
    const batch = items.slice(index, index + safeBatchSize);
    await Promise.all(batch.map((item) => worker(item)));
    await onBatchComplete?.(batch.length);
  }
}
