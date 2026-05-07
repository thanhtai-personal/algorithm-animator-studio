import storageAdapter from "@/lib/storageAdapter";
import { getPendingKey } from "@/constants/offlineQueue";

function parsePendingCount(raw: string | null): number {
  if (!raw) return 0;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.length;
    }
    if (parsed && typeof parsed === "object" && "items" in parsed) {
      const items = (parsed as { items?: unknown }).items;
      if (Array.isArray(items)) {
        return items.length;
      }
    }
  } catch {
    // Fallback below for unknown legacy formats.
  }

  return raw.trim() ? 1 : 0;
}

export function getPendingOfflineOperationCount(sessionOwnerId: string | null | undefined): number {
  if (!sessionOwnerId) return 0;
  const raw = storageAdapter.getItem(getPendingKey(sessionOwnerId));
  return parsePendingCount(raw);
}

export function hasPendingOfflineOperations(sessionOwnerId: string | null | undefined): boolean {
  return getPendingOfflineOperationCount(sessionOwnerId) > 0;
}

