// Version helpers for force reset
import { RESET_VERSION_KEY, ZERO_VERSION } from "@/features/app-shell/constants";

function readStoredVersion(): string {
  const raw = storageAdapter.getItem(RESET_VERSION_KEY);
  return raw || ZERO_VERSION;
}

function writeStoredVersion(version: string) {
  storageAdapter.setItem(RESET_VERSION_KEY, version);
}
export type StorageAdapter = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  keys: () => string[];
};

const noop: StorageAdapter = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  keys: () => [],
};

function getBrowserStorage(): StorageAdapter {
  if (typeof window === "undefined") return noop;
  try {
    const ls = window.localStorage;
    // Test access
    const testKey = "__storage_test__";
    ls.setItem(testKey, "1");
    ls.removeItem(testKey);
    return {
      getItem: (key) => ls.getItem(key),
      setItem: (key, value) => ls.setItem(key, value),
      removeItem: (key) => ls.removeItem(key),
      keys: () => {
        const result: string[] = [];
        for (let index = 0; index < ls.length; index += 1) {
          const key = ls.key(index);
          if (key) result.push(key);
        }
        return result;
      },
    };
  } catch (err) {
    console.warn("storageAdapter: localStorage unavailable", err);
    return noop;
  }
}


const StorageKeys = {
  categories: (userId: string) => `user:${userId}:categories`,
  userInfo: (userId: string) => `user:${userId}:info`,
  transactions: (userId: string) => `user:${userId}:transactions`,
  anonId: () => `anonId`,
  userId: () => `userId`,
};

const baseAdapter = getBrowserStorage();

const storageAdapter = {
  ...baseAdapter,
  StorageKeys,
  clearAll(): void {
    baseAdapter.keys().forEach((key) => baseAdapter.removeItem(key));
  },
  getCategories(userId: string): any | null {
    const raw = baseAdapter.getItem(StorageKeys.categories(userId));
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  setCategories(userId: string, categories: any): void {
    baseAdapter.setItem(StorageKeys.categories(userId), JSON.stringify(categories));
  },

  getUserInfo(userId: string): any | null {
    const raw = baseAdapter.getItem(StorageKeys.userInfo(userId));
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  setUserInfo(userId: string, userInfo: any): void {
    baseAdapter.setItem(StorageKeys.userInfo(userId), JSON.stringify(userInfo));
  },

  getTransactions(userId: string): any | null {
    const raw = baseAdapter.getItem(StorageKeys.transactions(userId));
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  setTransactions(userId: string, transactions: any): void {
    baseAdapter.setItem(StorageKeys.transactions(userId), JSON.stringify(transactions));
  },
  
  getAnonId(): string | null {
    return baseAdapter.getItem(StorageKeys.anonId());
  },
  setAnonId(anonId: string): void {
    baseAdapter.setItem(StorageKeys.anonId(), anonId);
  },

  getUserId(): string | null {
    return baseAdapter.getItem(StorageKeys.userId());
  },
  setUserId(userId: string): void {
    baseAdapter.setItem(StorageKeys.userId(), userId);
  },

  readStoredVersion,
  writeStoredVersion,
};

export default storageAdapter;

