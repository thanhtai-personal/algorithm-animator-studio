#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MAX_LINES = 500;
const MINI_APP_NAMES = [
  "kata-booking",
  "kata-calendar",
  "kata-rental-order",
  "kata-rental-revenue",
];
const SOURCE_EXTENSIONS = new Set([
  ".css",
  ".js",
  ".jsx",
  ".json",
  ".scss",
  ".ts",
  ".tsx",
]);

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const miniAppsRoot = path.resolve(scriptDir, "..");
const cwd = process.cwd();
const cwdAppName = MINI_APP_NAMES.find((appName) =>
  path.resolve(cwd).endsWith(`${path.sep}${appName}`),
);
const targetAppNames = cwdAppName ? [cwdAppName] : MINI_APP_NAMES;
const mode = process.env.ZALO_LONG_FILE_GUARD_MODE === "warn" ? "warn" : "fail";

async function walkSourceFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkSourceFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

function countLines(content) {
  if (content.length === 0) return 0;
  return content.split(/\r\n|\r|\n/).length - (content.endsWith("\n") ? 1 : 0);
}

const violations = [];

for (const appName of targetAppNames) {
  const appRoot = path.join(miniAppsRoot, appName);
  const srcRoot = path.join(appRoot, "src");
  const files = await walkSourceFiles(srcRoot);

  for (const file of files) {
    const content = await readFile(file, "utf8");
    const lineCount = countLines(content);
    if (lineCount <= MAX_LINES) continue;

    violations.push({
      appName,
      lineCount,
      relativePath: path.relative(appRoot, file).split(path.sep).join("/"),
    });
  }
}

if (violations.length === 0) {
  console.log(
    `[zalo-long-files] pass: ${targetAppNames.join(", ")} source files are <= ${MAX_LINES} lines.`,
  );
  process.exit(0);
}

const message = violations
  .sort((left, right) => right.lineCount - left.lineCount)
  .map(
    (violation) =>
      `[zalo-long-files] ${violation.appName}/${violation.relativePath} has ${violation.lineCount} lines (max ${MAX_LINES})`,
  )
  .join("\n");

if (mode === "warn") {
  console.warn(message);
  process.exit(0);
}

console.error(message);
process.exit(1);
