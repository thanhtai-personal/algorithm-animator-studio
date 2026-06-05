#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const srcDir = join(root, "src");
const extensions = new Set([".ts", ".tsx"]);
const ignoredPaths = [
  "src/lib/i18n.ts",
  "src/assets",
  "src/components/ui",
  "src/pages/algorithm-world/phaserMazePreviewShared.ts",
];
const ignoredPatterns = [
  /^className=/,
  /^id=/,
  /^key=/,
  /^type=/,
  /^value=/,
  /^htmlFor=/,
  /^href=/,
  /^to=/,
  /^target=/,
  /^rel=/,
  /^variant=/,
  /^size=/,
  /^role=/,
  /^viewBox=/,
  /^d=/,
  /^fill=/,
  /^stroke=/,
  /^xmlns=/,
  /^import\s/,
  /^from\s/,
  /^export\s/,
];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) return walk(full);
    const ext = full.slice(full.lastIndexOf("."));
    return extensions.has(ext) ? [full] : [];
  });
}

function shouldIgnoreFile(file) {
  const normalized = relative(root, file).replaceAll("\\", "/");
  return ignoredPaths.some((item) => normalized === item || normalized.startsWith(`${item}/`));
}

function hasHumanText(value) {
  const text = value.trim();
  if (text.length < 3) return false;
  if (/^[A-Z0-9_./:#?=&%\-{}()[\]<>|,+*`~@!\s]+$/.test(text)) return false;
  if (/^[a-z0-9_.:/#?=&%\-{}()[\]<>|,+*`~@!\s]+$/.test(text)) return false;
  return /[A-Za-zÀ-ỹ]/.test(text) && /\s|[À-ỹ]/.test(text);
}

const findings = [];
for (const file of walk(srcDir)) {
  if (shouldIgnoreFile(file)) continue;
  const rel = relative(root, file).replaceAll("\\", "/");
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.includes("text(") || trimmed.includes("txt(") || trimmed.includes("t(")) return;
    if (ignoredPatterns.some((pattern) => pattern.test(trimmed))) return;

    const jsxTextMatches = [...line.matchAll(/>([^<{][^<>{}]*)</g)].map((match) => match[1]);
    const stringMatches = [...line.matchAll(/(?<!import\s.*)(?:aria-label|title|placeholder|alt|label|description|message|toast\.(?:success|error|info|warning)|window\.confirm)\s*=\s*["'`]([^"'`]+)["'`]/g)].map((match) => match[1]);

    for (const value of [...jsxTextMatches, ...stringMatches]) {
      if (hasHumanText(value)) findings.push(`${rel}:${index + 1}: ${trimmed}`);
    }
  });
}

if (findings.length) {
  console.error(`Found ${findings.length} possible hard-coded UI text item(s).`);
  console.error(findings.slice(0, 200).join("\n"));
  if (findings.length > 200) console.error(`...and ${findings.length - 200} more.`);
  process.exit(1);
}

console.log("No obvious hard-coded UI text found.");
