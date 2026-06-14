import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { PROJECT_ROOT, SERVER_DATA_DIR } from "../config/paths";
import { ensureDirectoryExists } from "../utils/audioOutput";
import { readEnvValues, type RuntimeEnvValues } from "./EnvFileService";
import type { PublishPlatform } from "../models/PublishQueue";

export type SocialProviderAccount = {
  id: string;
  platform: Exclude<PublishPlatform, "youtube">;
  remoteId: string;
  name: string;
  handle?: string;
  url?: string;
  thumbnailUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAtMs?: number;
  createdAtMs: number;
  updatedAtMs: number;
};

export type PublicSocialProviderAccount = Omit<SocialProviderAccount, "accessToken" | "refreshToken"> & {
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
};

const ACCOUNTS_FILE_NAME = "social-provider-accounts.json";

export function listSocialProviderAccounts(envOverrides: RuntimeEnvValues = {}): PublicSocialProviderAccount[] {
  return readAccounts(envOverrides).map(toPublicAccount);
}

export function getSocialProviderAccount(accountId: string | undefined, envOverrides: RuntimeEnvValues = {}) {
  if (!accountId) return null;
  return readAccounts(envOverrides).find((account) => account.id === accountId) || null;
}

export function upsertSocialProviderAccounts(
  accounts: Array<Omit<SocialProviderAccount, "id" | "createdAtMs" | "updatedAtMs"> & { id?: string }>,
  envOverrides: RuntimeEnvValues = {}
): PublicSocialProviderAccount[] {
  const now = Date.now();
  const current = readAccounts(envOverrides);
  const next = [...current];

  for (const account of accounts) {
    const id = account.id || buildAccountId(account.platform, account.remoteId);
    const index = next.findIndex((item) => item.id === id || (item.platform === account.platform && item.remoteId === account.remoteId));
    const previous = index >= 0 ? next[index] : null;
    const saved: SocialProviderAccount = {
      ...(previous || {}),
      ...account,
      id,
      createdAtMs: previous?.createdAtMs || now,
      updatedAtMs: now,
    };

    if (index >= 0) next[index] = saved;
    else next.unshift(saved);
  }

  writeAccounts(next, envOverrides);
  return next.map(toPublicAccount);
}

export function removeSocialProviderAccount(accountId: string, envOverrides: RuntimeEnvValues = {}) {
  const next = readAccounts(envOverrides).filter((account) => account.id !== accountId);
  writeAccounts(next, envOverrides);
  return { ok: true, accounts: next.map(toPublicAccount) };
}

function toPublicAccount(account: SocialProviderAccount): PublicSocialProviderAccount {
  const { accessToken: _accessToken, refreshToken: _refreshToken, ...rest } = account;
  return {
    ...rest,
    hasAccessToken: Boolean(account.accessToken),
    hasRefreshToken: Boolean(account.refreshToken),
  };
}

function readAccounts(envOverrides: RuntimeEnvValues = {}): SocialProviderAccount[] {
  const file = getAccountsFile(envOverrides);
  if (!fs.existsSync(file)) return [];

  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as SocialProviderAccount[];
    return Array.isArray(parsed) ? parsed.filter(isAccount) : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: SocialProviderAccount[], envOverrides: RuntimeEnvValues = {}) {
  const dataDir = getServerDataDir(envOverrides);
  ensureDirectoryExists(dataDir);
  fs.writeFileSync(getAccountsFile(envOverrides), JSON.stringify(accounts, null, 2), "utf8");
}

function getAccountsFile(envOverrides: RuntimeEnvValues = {}) {
  return path.join(getServerDataDir(envOverrides), ACCOUNTS_FILE_NAME);
}

function getServerDataDir(envOverrides: RuntimeEnvValues = {}) {
  const configuredPath = readEnvValues(envOverrides).SERVER_DATA_DIR || SERVER_DATA_DIR;
  const trimmed = configuredPath.trim();
  if (!trimmed) return SERVER_DATA_DIR;
  return path.isAbsolute(trimmed) ? trimmed : path.resolve(PROJECT_ROOT, trimmed);
}

function buildAccountId(platform: PublishPlatform, remoteId: string) {
  const cleanRemoteId = remoteId || crypto.randomUUID();
  return `${platform}-${cleanRemoteId}`;
}

function isAccount(value: Partial<SocialProviderAccount>): value is SocialProviderAccount {
  return Boolean(value.id && value.platform && value.remoteId && value.name);
}
