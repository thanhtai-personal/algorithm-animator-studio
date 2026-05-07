import type { SupabaseClient } from "@supabase/supabase-js";

import storageAdapter from "@/lib/storageAdapter";

export type AppLockMethod = "pin";

export type AppLockPinResult =
  | { success: true; pinHash: string }
  | { success: false; error: "cryptoUnavailable" | "storageUnavailable" | "failed" };

export const APP_LOCK_KEYS = {
  enabled: "app.lock.enabled",
  method: "app.lock.method",
  pin: "app.lock.pin",
  user: "app.lock.user",
} as const;

const APP_LOCK_EVENT = "app-lock-update";

// Singleton to track last synced user (prevents duplicate sync calls)
let lastSyncedUserId: string | null = null;

export function markUserAsSynced(userId: string) {
  lastSyncedUserId = userId;
}

export function hasUserBeenSynced(userId: string): boolean {
  return lastSyncedUserId === userId;
}

export function clearSyncedUser() {
  lastSyncedUserId = null;
}

function notifyAppLockUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(APP_LOCK_EVENT));
}

function getStoredPinValue() {
  return storageAdapter.getItem(APP_LOCK_KEYS.pin);
}

function getStoredPinOwner() {
  return storageAdapter.getItem(APP_LOCK_KEYS.user);
}

export function setAppLockPinOwner(userId: string | null) {
  if (!userId) {
    storageAdapter.removeItem(APP_LOCK_KEYS.user);
    return;
  }
  storageAdapter.setItem(APP_LOCK_KEYS.user, userId);
}

export function ensureAppLockPinOwner(userId: string | null) {
  if (!userId) return;
  if (!getStoredPinValue()) return;
  if (getStoredPinOwner()) return;
  setAppLockPinOwner(userId);
  notifyAppLockUpdate();
}

function isPinHash(value: string) {
  return /^[0-9a-f]{64}$/i.test(value);
}

function isLegacyPin(value: string) {
  return /^[0-9]{4}$/.test(value) || /^[0-9]{6}$/.test(value);
}

export function isAppLockPinHash(value: string) {
  return isPinHash(value);
}

export async function hashAppLockPin(userId: string, pin: string) {
  if (!globalThis.crypto?.subtle) {
    return null;
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(`${userId}:${pin}`);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function getLocalPinHash(userId: string) {
  const stored = getStoredPinValue();
  if (!stored) return null;
  if (isPinHash(stored)) return stored;
  if (isLegacyPin(stored)) {
    const hash = await hashAppLockPin(userId, stored);
    if (hash) {
      setAppLockPinHash(hash);
    }
    return hash;
  }
  return null;
}

export function getAppLockConfig() {
  const enabled = storageAdapter.getItem(APP_LOCK_KEYS.enabled) === "true";
  const method = storageAdapter.getItem(APP_LOCK_KEYS.method) as AppLockMethod | null;
  const pinHash = getStoredPinValue();
  return { enabled, method: enabled ? method : null, pinHash };
}

export function setAppLockConfig(enabled: boolean, method: AppLockMethod | null) {
  if (!enabled || !method) {
    storageAdapter.removeItem(APP_LOCK_KEYS.enabled);
    storageAdapter.removeItem(APP_LOCK_KEYS.method);
    notifyAppLockUpdate();
    return;
  }
  storageAdapter.setItem(APP_LOCK_KEYS.enabled, "true");
  storageAdapter.setItem(APP_LOCK_KEYS.method, method);
  notifyAppLockUpdate();
}

export async function setAppLockPin(userId: string, pin: string): Promise<AppLockPinResult> {
  if (!globalThis.crypto?.subtle) {
    try {
      storageAdapter.setItem(APP_LOCK_KEYS.pin, pin);
      setAppLockPinOwner(userId);
    } catch {
      return { success: false, error: "storageUnavailable" };
    }
    notifyAppLockUpdate();
    return { success: true, pinHash: pin };
  }
  let hash: string | null = null;
  try {
    hash = await hashAppLockPin(userId, pin);
  } catch {
    return { success: false, error: "failed" };
  }
  if (!hash) {
    return { success: false, error: "cryptoUnavailable" };
  }
  try {
    storageAdapter.setItem(APP_LOCK_KEYS.pin, hash);
    setAppLockPinOwner(userId);
  } catch {
    return { success: false, error: "storageUnavailable" };
  }
  notifyAppLockUpdate();
  return { success: true, pinHash: hash };
}

export function setAppLockPinHash(pinHash: string | null) {
  if (!pinHash) {
    storageAdapter.removeItem(APP_LOCK_KEYS.pin);
    storageAdapter.removeItem(APP_LOCK_KEYS.user);
    notifyAppLockUpdate();
    return;
  }
  storageAdapter.setItem(APP_LOCK_KEYS.pin, pinHash);
  notifyAppLockUpdate();
}

export function clearAppLockPin() {
  storageAdapter.removeItem(APP_LOCK_KEYS.pin);
  storageAdapter.removeItem(APP_LOCK_KEYS.user);
  notifyAppLockUpdate();
}

export async function verifyAppLockPin(userId: string, pin: string) {
  const stored = getStoredPinValue();
  if (!stored) return false;
  const storedOwner = getStoredPinOwner();
  const ownerId = storedOwner || userId;
  if (isPinHash(stored)) {
    const hash = await hashAppLockPin(ownerId, pin);
    const valid = Boolean(hash && stored === hash);
    if (valid && userId && ownerId !== userId) {
      const nextHash = await hashAppLockPin(userId, pin);
      if (nextHash) {
        storageAdapter.setItem(APP_LOCK_KEYS.pin, nextHash);
        setAppLockPinOwner(userId);
        notifyAppLockUpdate();
      }
    }
    return valid;
  }
  if (isLegacyPin(stored)) {
    if (stored !== pin) return false;
    const hash = await hashAppLockPin(ownerId, pin);
    if (hash) {
      storageAdapter.setItem(APP_LOCK_KEYS.pin, hash);
      setAppLockPinOwner(ownerId);
      notifyAppLockUpdate();
    }
    if (userId && ownerId !== userId) {
      const nextHash = await hashAppLockPin(userId, pin);
      if (nextHash) {
        storageAdapter.setItem(APP_LOCK_KEYS.pin, nextHash);
        setAppLockPinOwner(userId);
        notifyAppLockUpdate();
      }
    }
    return true;
  }
  return false;
}

export async function updateRemoteAppLockConfig(
  supabase: SupabaseClient,
  userId: string,
  config: { enabled: boolean; method: AppLockMethod | null; pinHash?: string | null }
) {
  const payload = {
    user_id: userId,
    screen_lock_enabled: config.enabled,
    screen_lock_method: config.enabled ? config.method : null,
    screen_lock_pin_hash: config.enabled ? config.pinHash ?? null : null,
  };
  const { error } = await supabase
    .from("user_security_settings")
    .upsert(payload, { onConflict: "user_id" });
  if (error) {
    console.warn("app_lock_sync_failed", error.message);
  }
}

export async function syncAppLockFromServer(supabase: SupabaseClient, userId: string) {
  // Skip if already synced for this user (prevents duplicate calls)
  if (hasUserBeenSynced(userId)) {
    return null;
  }
  
  markUserAsSynced(userId);
  
  const { data, error } = await supabase
    .from("user_security_settings")
    .select("screen_lock_enabled, screen_lock_method, screen_lock_pin_hash")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.warn("app_lock_sync_failed", error.message);
    return null;
  }

  if (!data) {
    const localConfig = getAppLockConfig();
    const pinHash = await getLocalPinHash(userId);
    await updateRemoteAppLockConfig(supabase, userId, {
      enabled: localConfig.enabled && localConfig.method === "pin",
      method: localConfig.method === "pin" ? "pin" : null,
      pinHash,
    });
    return null;
  }

  const resolvedMethod = data.screen_lock_method === "pin" ? "pin" : null;
  const resolvedEnabled = Boolean(data.screen_lock_enabled && resolvedMethod);
  const localConfig = getAppLockConfig();
  const localPinHash = await getLocalPinHash(userId);

  if (!resolvedEnabled && localConfig.enabled && localConfig.method === "pin" && localPinHash) {
    await updateRemoteAppLockConfig(supabase, userId, {
      enabled: true,
      method: "pin",
      pinHash: localPinHash,
    });
    setAppLockConfig(true, "pin");
    setAppLockPinHash(localPinHash);
    return { enabled: true, method: "pin", pinHash: localPinHash };
  }

  setAppLockConfig(resolvedEnabled, resolvedMethod);
  setAppLockPinHash(data.screen_lock_pin_hash ?? null);

  return {
    enabled: resolvedEnabled,
    method: resolvedMethod,
    pinHash: data.screen_lock_pin_hash ?? null,
  };
}
