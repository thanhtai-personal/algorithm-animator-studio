import storageAdapter from "@/lib/storageAdapter";

const POS_PASSKEY_UNLOCK_KEY = "sales:pos-passkey-unlock:v1";

interface PosPasskeyUnlockSession {
  userId: string;
  branchId: string | null;
  version: number;
}

function normalizeBranchId(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeUserId(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export function clearPosPasskeyUnlockSession(): void {
  storageAdapter.removeItem(POS_PASSKEY_UNLOCK_KEY);
}

export function persistPosPasskeyUnlockSession(payload: {
  userId: string;
  branchId: string | null;
  version: number;
}): void {
  const userId = normalizeUserId(payload.userId);
  if (!userId) {
    clearPosPasskeyUnlockSession();
    return;
  }

  const session: PosPasskeyUnlockSession = {
    userId,
    branchId: normalizeBranchId(payload.branchId),
    version: Math.max(0, Math.trunc(payload.version)),
  };

  storageAdapter.setItem(POS_PASSKEY_UNLOCK_KEY, JSON.stringify(session));
}

function readPosPasskeyUnlockSession(): PosPasskeyUnlockSession | null {
  const raw = storageAdapter.getItem(POS_PASSKEY_UNLOCK_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PosPasskeyUnlockSession;
    const userId = normalizeUserId(parsed.userId);
    if (!userId) return null;

    return {
      userId,
      branchId: normalizeBranchId(parsed.branchId),
      version: Math.max(0, Math.trunc(parsed.version ?? 0)),
    };
  } catch {
    return null;
  }
}

export function isPosPasskeyUnlockedForContext(payload: {
  userId: string | null;
  branchId: string | null;
  version: number;
}): boolean {
  const userId = normalizeUserId(payload.userId);
  if (!userId) return false;

  const session = readPosPasskeyUnlockSession();
  if (!session) return false;

  return (
    session.userId === userId &&
    session.branchId === normalizeBranchId(payload.branchId) &&
    session.version === Math.max(0, Math.trunc(payload.version))
  );
}
