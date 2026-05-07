import type { TransactionType } from "@/features/transactions/types";
import type { UserSettings } from "@/types/userSettings";

export type PendingTransactionCreatePayload = {
  id: string;
  amount: number;
  description: string;
  categoryId: string;
  type: TransactionType;
  date: string;
};

export type PendingTransactionUpdatePayload = {
  id: string;
  updates: {
    amount?: number;
    description?: string;
    categoryId?: string;
    type?: TransactionType;
    date?: string;
  };
};

export type PendingTransactionDeletePayload = { id: string };

export type PendingCategoryCreatePayload = {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
};

export type PendingCategoryUpdatePayload = {
  id: string;
  updates: {
    name?: string;
    icon?: string | null;
    color?: string | null;
  };
};

export type PendingCategoryDeletePayload = { id: string };

export type PendingSettingsUpdatePayload = {
  updates: Partial<UserSettings>;
};

export type PendingOperation =
  | { id: string; entity: "transaction"; action: "create"; payload: PendingTransactionCreatePayload }
  | { id: string; entity: "transaction"; action: "update"; payload: PendingTransactionUpdatePayload }
  | { id: string; entity: "transaction"; action: "delete"; payload: PendingTransactionDeletePayload }
  | { id: string; entity: "category"; action: "create"; payload: PendingCategoryCreatePayload }
  | { id: string; entity: "category"; action: "update"; payload: PendingCategoryUpdatePayload }
  | { id: string; entity: "category"; action: "delete"; payload: PendingCategoryDeletePayload }
  | { id: string; entity: "settings"; action: "update"; payload: PendingSettingsUpdatePayload };
