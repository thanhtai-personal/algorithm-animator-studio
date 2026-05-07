import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function parseEnvLine(line: string): [string, string] | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;

  const normalized = trimmed.startsWith('export ')
    ? trimmed.slice('export '.length).trimStart()
    : trimmed;
  const delimiterIndex = normalized.indexOf('=');
  if (delimiterIndex <= 0) return null;

  const key = normalized.slice(0, delimiterIndex).trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return null;

  let value = normalized.slice(delimiterIndex + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return [key, value];
}

function applyEnvFile(filePath: string): void {
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/u)) {
    const parsed = parseEnvLine(line);
    if (!parsed) continue;
    const [key, value] = parsed;
    if (process.env[key] !== undefined) continue;
    process.env[key] = value;
  }
}

function resolveServerRoot(): string {
  const candidates = [
    process.cwd(),
    resolve(process.cwd(), 'apps/server'),
    resolve(__dirname, '..', '..', '..'),
    resolve(__dirname, '..', '..', '..', '..'),
  ];

  for (const candidate of candidates) {
    if (
      existsSync(resolve(candidate, 'package.json')) &&
      existsSync(resolve(candidate, 'src/main.ts'))
    ) {
      return candidate;
    }
  }

  return process.cwd();
}

export function loadServerEnvFiles(): void {
  const root = resolveServerRoot();
  const nodeEnv =
    (process.env.NODE_ENV ?? 'development').trim() || 'development';

  const envPaths = [
    resolve(root, '.env.local'),
    resolve(root, `.env.${nodeEnv}`),
    resolve(root, '.env'),
  ];

  for (const envPath of envPaths) {
    applyEnvFile(envPath);
  }
}
