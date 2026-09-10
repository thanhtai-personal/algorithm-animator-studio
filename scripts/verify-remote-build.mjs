import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const requiredFiles = [
  "dist-remote/index.html",
  "dist-electron/remote-server/index.js",
  "electron/remote-main.cjs",
  "electron/remote-preload.cjs",
  "build/electron-builder.remote.json",
];

const missing = requiredFiles.filter((relativePath) => !fs.existsSync(path.join(root, relativePath)));
if (missing.length) {
  console.error(`[kai-remote] Build thiếu file:\n${missing.map((item) => `- ${item}`).join("\n")}`);
  process.exit(1);
}

const html = fs.readFileSync(path.join(root, "dist-remote/index.html"), "utf8");
const assetReferences = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((value) => value.startsWith("/assets/"));
const missingAssets = assetReferences.filter((value) => !fs.existsSync(path.join(root, "dist-remote", value.slice(1))));
if (missingAssets.length) {
  console.error(`[kai-remote] Renderer thiếu asset:\n${missingAssets.map((item) => `- ${item}`).join("\n")}`);
  process.exit(1);
}

console.log(`[kai-remote] Build verified (${assetReferences.length} renderer assets).`);
