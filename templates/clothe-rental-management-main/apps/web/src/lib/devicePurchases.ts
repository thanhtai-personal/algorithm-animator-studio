/**
 * Device-based purchases for anonymous/guest users
 * Purchases are stored in localStorage and tied to the device
 * Users can upgrade to cloud-backed purchases by signing in
 */

import storageAdapter from "./storageAdapter";

const DEVICE_PURCHASES_KEY = "spendsmart:device-purchases";
const DEVICE_AD_REMOVAL_KEY = "spendsmart:device-ad-removal";

export interface DevicePurchase {
  packageId: string;
  purchaseToken?: string; // Optional: for future verification
  timestamp: number;
  anonymousId?: string;
  userId?: string; // Set when user signs in
  platform: "web" | "ios" | "android";
  price: number;
  currency: string;
}

export interface AdRemovalStatus {
  isActive: boolean;
  expiresAt?: number; // For monthly/yearly subscriptions
  packageId: string;
  purchasedAt: number;
}

/**
 * Get all device purchases
 */
export function getDevicePurchases(): DevicePurchase[] {
  const data = storageAdapter.getItem(DEVICE_PURCHASES_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * Save a new purchase to device
 */
export function saveDevicePurchase(purchase: Omit<DevicePurchase, "timestamp">): void {
  const purchases = getDevicePurchases();
  const newPurchase: DevicePurchase = {
    ...purchase,
    timestamp: Date.now(),
  };
  purchases.push(newPurchase);
  storageAdapter.setItem(DEVICE_PURCHASES_KEY, JSON.stringify(purchases));

  // Update ad removal status if it's an ad package
  if (purchase.packageId.startsWith("ad-")) {
    updateAdRemovalStatus(purchase.packageId);
  }
}

/**
 * Check if user has purchased a specific package
 */
export function hasPurchased(packageId: string): boolean {
  const purchases = getDevicePurchases();
  return purchases.some((p) => p.packageId === packageId);
}

/**
 * Get ad removal status
 */
export function getAdRemovalStatus(): AdRemovalStatus | null {
  const data = storageAdapter.getItem(DEVICE_AD_REMOVAL_KEY);
  if (!data) return null;
  try {
    const status = JSON.parse(data) as AdRemovalStatus;
    
    // Check if expired
    if (status.expiresAt && status.expiresAt < Date.now()) {
      return null;
    }
    
    return status;
  } catch {
    return null;
  }
}

/**
 * Check if ads are removed
 */
export function isAdFree(): boolean {
  const status = getAdRemovalStatus();
  return status?.isActive ?? false;
}

/**
 * Update ad removal status based on package
 */
function updateAdRemovalStatus(packageId: string): void {
  const now = Date.now();
  let expiresAt: number | undefined;

  if (packageId === "ad-monthly") {
    // Expires in 30 days
    expiresAt = now + 30 * 24 * 60 * 60 * 1000;
  } else if (packageId === "ad-yearly") {
    // Expires in 365 days
    expiresAt = now + 365 * 24 * 60 * 60 * 1000;
  }
  // ad-lifetime: no expiry

  const status: AdRemovalStatus = {
    isActive: true,
    expiresAt,
    packageId,
    purchasedAt: now,
  };

  storageAdapter.setItem(DEVICE_AD_REMOVAL_KEY, JSON.stringify(status));
}

/**
 * Clear all device purchases (e.g., on sign out)
 */
export function clearDevicePurchases(): void {
  storageAdapter.removeItem(DEVICE_PURCHASES_KEY);
  storageAdapter.removeItem(DEVICE_AD_REMOVAL_KEY);
}

/**
 * Migrate device purchases to user account
 * Call this after successful sign in
 */
export function prepareDevicePurchasesForMigration(userId: string): DevicePurchase[] {
  const purchases = getDevicePurchases();
  return purchases.map((p) => ({ ...p, userId }));
}

/**
 * Get purchase summary for display
 */
export function getPurchaseSummary(): {
  totalPurchases: number;
  adRemoved: boolean;
  aiRequests: number;
} {
  const purchases = getDevicePurchases();
  const adRemoved = isAdFree();
  
  // Count AI requests from purchases
  const aiRequests = purchases
    .filter((p) => p.packageId.startsWith("ai-"))
    .reduce((sum, p) => {
      if (p.packageId === "ai-250") return sum + 250;
      if (p.packageId === "ai-3000") return sum + 3000;
      return sum;
    }, 0);

  return {
    totalPurchases: purchases.length,
    adRemoved,
    aiRequests,
  };
}
