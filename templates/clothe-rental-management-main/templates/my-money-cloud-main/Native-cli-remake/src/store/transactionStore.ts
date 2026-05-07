
import { makeAutoObservable } from "mobx";
import type { Transaction } from "@/features/transactions/types";
import storageAdapter from "@/lib/storageAdapter";

function createFallbackId(): string {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj?.randomUUID) {
    return cryptoObj.randomUUID();
  }
  return `tx_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

class TransactionStore {
  transactions: Transaction[] = [];

  get userId(): string | null {
    return storageAdapter.getAnonId() || storageAdapter.getUserId();
  }

  get storageUserId(): string | null {
    return this.userId;
  }

  private static _instance: TransactionStore | null = null;
  private constructor() {
    makeAutoObservable(this);
  }
  static getInstance(): TransactionStore {
    if (!TransactionStore._instance) {
      TransactionStore._instance = new TransactionStore();
    }
    return TransactionStore._instance;
  }

  load(): void {
    const userId = this.storageUserId;
    if (!userId) {
      this.transactions = [];
      return;
    }
    const arr = storageAdapter.getTransactions(userId) as Transaction[] | null;
    if (!arr) {
      this.transactions = [];
      return;
    }
    this.transactions = arr.map((t) => ({ ...t, date: new Date(t.date), createdAt: new Date(t.createdAt) }));
  }

  write(transactions: Transaction[]): void {
    const userId = this.storageUserId;
    if (!userId) return;
    this.transactions = transactions;
    storageAdapter.setTransactions(userId, transactions);
  }

  findById(id: string): Transaction | undefined {
    return this.transactions.find((item) => item.id === id);
  }

  upsert(transaction: Transaction): void {
    const userId = this.storageUserId;
    if (!userId) return;
    const idx = this.transactions.findIndex((item) => item.id === transaction.id);
    if (idx !== -1) {
      this.transactions[idx] = transaction;
    } else {
      this.transactions.push({
        ...transaction,
        id: transaction.id || createFallbackId(),
      });
    }
    this.transactions = this.transactions.slice();
    storageAdapter.setTransactions(userId, this.transactions);
  }

  remove(id: string): void {
    const userId = this.storageUserId;
    if (!userId) return;
    this.transactions = this.transactions.filter((item) => item.id !== id);
    storageAdapter.setTransactions(userId, this.transactions);
  }

  clear(): void {
    const userId = this.storageUserId;
    if (!userId) return;
    this.transactions = [];
    storageAdapter.setTransactions(userId, []);
  }

  clearForUser(userId: string): void {
    this.transactions = [];
    storageAdapter.setTransactions(userId, []);
  }
}

export const transactionStore = TransactionStore.getInstance();
