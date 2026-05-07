import AsyncStorage from "@react-native-async-storage/async-storage";

// Version helpers for force reset
import { RESET_VERSION_KEY, ZERO_VERSION } from "@/features/app-shell/constants";

export type StorageAdapter = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  keys: () => string[];
};

export type StorageAdapterWithHydrate = StorageAdapter & {
  hydrate: () => Promise<void>;
  isHydrated: () => boolean;
};

type StorageAdapterExtras = {
  StorageKeys: typeof StorageKeys;
  clearAll: () => void;
  getCategories: (userId: string) => any | null;
  setCategories: (userId: string, categories: any) => void;
  getUserInfo: (userId: string) => any | null;
  setUserInfo: (userId: string, userInfo: any) => void;
  getTransactions: (userId: string) => any | null;
  setTransactions: (userId: string, transactions: any) => void;
  getAnonId: () => string | null;
  setAnonId: (anonId: string) => void;
  getUserId: () => string | null;
  setUserId: (userId: string) => void;
  readStoredVersion: () => string;
  writeStoredVersion: (version: string) => void;
};

const cache = new Map<string, string>();
let hydrated = false;

async function hydrateCache() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    if (keys.length === 0) {
      hydrated = true;
      return;
    }
    const entries = await AsyncStorage.multiGet(keys);
    cache.clear();
    entries.forEach(([key, value]) => {
      if (value != null) {
        cache.set(key, value);
      }
    });
    hydrated = true;
  } catch (error) {
    console.warn("storageAdapter: hydrate failed", error);
  }
}

function readStoredVersion(): string {
  const raw = storageAdapter.getItem(RESET_VERSION_KEY);
  return raw || ZERO_VERSION;
}

function writeStoredVersion(version: string) {
  storageAdapter.setItem(RESET_VERSION_KEY, version);
}

const StorageKeys = {
  categories: (userId: string) => `user:${userId}:categories`,
  userInfo: (userId: string) => `user:${userId}:info`,
  transactions: (userId: string) => `user:${userId}:transactions`,
  anonId: () => `anonId`,
  userId: () => `userId`,
};

const baseAdapter: StorageAdapter = {
  getItem: (key) => cache.get(key) ?? null,
  setItem: (key, value) => {
    cache.set(key, value);
    void AsyncStorage.setItem(key, value);
  },
  removeItem: (key) => {
    cache.delete(key);
    void AsyncStorage.removeItem(key);
  },
  keys: () => Array.from(cache.keys()),
};

const storageAdapter: StorageAdapterWithHydrate & StorageAdapterExtras = {
  ...baseAdapter,
  StorageKeys,
  hydrate: hydrateCache,
  isHydrated: () => hydrated,
  clearAll(): void {
    const keys = baseAdapter.keys();
    cache.clear();
    if (keys.length) {
      void AsyncStorage.multiRemove(keys);
    }
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
