import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sourceRoots = ["src", "server"];
const exts = ["", ".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs", ".json", ".css", ".scss", ".png", ".svg", ".webp", ".jpg", ".jpeg", ".wav", ".mp3"];
const indexExts = ["index.ts", "index.tsx", "index.mts", "index.cts", "index.js", "index.mjs", "index.cjs"];

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((item) => {
    const file = path.join(dir, item.name);
    return item.isDirectory() ? listFiles(file) : item.isFile() ? [file] : [];
  });
}

function resolveLocalImport(current, specifier) {
  const clean = specifier.split(/[?#]/, 1)[0];
  if (!clean.startsWith("./") && !clean.startsWith("../") && !clean.startsWith("@/")) return null;
  const base = clean.startsWith("@/")
    ? path.resolve(root, "src", clean.slice(2))
    : path.resolve(path.dirname(current), clean);
  const choices = [
    ...exts.map((ext) => base + ext),
    ...indexExts.map((index) => path.join(base, index)),
  ];
  return { specifier, resolved: choices.some((file) => fs.existsSync(file)), base };
}

test("TypeScript and JS source have no dangling local import targets", () => {
  const missing = [];
  for (const sourceRoot of sourceRoots) {
    for (const file of listFiles(path.join(root, sourceRoot))) {
      if (!/\.(?:[cm]?js|[cm]?ts|jsx|tsx)$/.test(file)) continue;
      if (file.endsWith(".d.ts")) continue;
      const content = fs.readFileSync(file, "utf8");
      // Both static imports/re-exports and import("...") expressions.
      const regex = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*|\brequire\s*\(\s*)["']([^"']+)["']/g;
      for (const match of content.matchAll(regex)) {
        const target = resolveLocalImport(file, match[1]);
        if (target && !target.resolved) {
          missing.push(`${path.relative(root, file)} -> ${target.specifier}`);
        }
      }
    }
  }
  assert.deepEqual(missing, [], `Broken local imports:\n${missing.join("\n")}`);
});
