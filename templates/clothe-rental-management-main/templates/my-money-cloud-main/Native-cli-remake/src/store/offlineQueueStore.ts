
import { makeAutoObservable } from "mobx";
import { getPendingKey } from "@/constants/offlineQueue";
import storageAdapter from "@/lib/storageAdapter";
import type { PendingOperation } from "@/types/offlineQueue";


function getCurrentUserId(): string | null {
  return storageAdapter.getAnonId() || storageAdapter.getUserId();
}

function safeRead(userId?: string): PendingOperation[] {
  const uid = userId || getCurrentUserId();
  if (!uid) return [];
  const raw = storageAdapter.getItem(getPendingKey(uid));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PendingOperation[]) : [];
  } catch {
    return [];
  }
}

function safeWrite(operations: PendingOperation[], userId?: string) {
  const uid = userId || getCurrentUserId();
  if (!uid) return;
  storageAdapter.setItem(getPendingKey(uid), JSON.stringify(operations));
}

class OfflineQueueStore {
  version = 0;
  private listeners = new Set<() => void>();
  private static _instance: OfflineQueueStore | null = null;
  private constructor() {
    makeAutoObservable(this);
  }
  static getInstance(): OfflineQueueStore {
    if (!OfflineQueueStore._instance) {
      OfflineQueueStore._instance = new OfflineQueueStore();
    }
    return OfflineQueueStore._instance;
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // FIFO queue operations
  read(userId?: string): PendingOperation[] {
    return safeRead(userId);
  }

  write(operations: PendingOperation[], userId?: string) {
    safeWrite(operations, userId);
    this.version += 1;
    this.notify();
  }

  enqueue(operation: PendingOperation, userId?: string) {
    // Add to end of queue
    const queue = this.read(userId);
    queue.push(operation);
    this.write(queue, userId);
  }

  dequeue(userId?: string): PendingOperation | undefined {
    // Remove from front of queue
    const queue = this.read(userId);
    const op = queue.shift();
    this.write(queue, userId);
    return op;
  }

  clear(userId?: string) {
    this.write([], userId);
  }

  getCount(userId?: string) {
    return this.read(userId).length;
  }

  getTransactionDeleteIds(userId?: string) {
    return this.read(userId)
      .filter((op) => op.entity === "transaction" && op.action === "delete")
      .map((op) => (op as Extract<PendingOperation, { entity: "transaction"; action: "delete" }>).payload.id);
  }

  getCategoryDeleteIds(userId?: string) {
    return this.read(userId)
      .filter((op) => op.entity === "category" && op.action === "delete")
      .map((op) => (op as Extract<PendingOperation, { entity: "category"; action: "delete" }>).payload.id);
  }

  replacePendingTransactionCategory(fromCategoryId: string, toCategoryId: string, userId?: string) {
    const queue = this.read(userId);
    let updated = false;
    const next = queue.map((operation) => {
      if (operation.entity !== "transaction") return operation;
      if (operation.action === "create" && operation.payload.categoryId === fromCategoryId) {
        updated = true;
        return {
          ...operation,
          payload: { ...operation.payload, categoryId: toCategoryId },
        };
      }
      if (
        operation.action === "update" &&
        operation.payload.updates.categoryId === fromCategoryId
      ) {
        updated = true;
        return {
          ...operation,
          payload: {
            ...operation.payload,
            updates: { ...operation.payload.updates, categoryId: toCategoryId },
          },
        };
      }
      return operation;
    });
    if (updated) {
      this.write(next, userId);
    }
  }
}

export const offlineQueueStore = OfflineQueueStore.getInstance();
