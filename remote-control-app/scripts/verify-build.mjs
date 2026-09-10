import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const requiredFiles = [
  "remote-control-app/dist/index.html",
  "remote-control-app/dist/favicon.ico",
  "remote-control-app/dist-server/index.cjs",
  "remote-control-app/dist-package/package.json",
  "remote-control-app/dist-package/remote-client/index.html",
  "remote-control-app/dist-package/dist-server/index.cjs",
  "remote-control-app/electron/main.cjs",
  "remote-control-app/electron/preload.cjs",
  "remote-control-app/electron-builder.json",
];

const missing = requiredFiles.filter((relativePath) => !fs.existsSync(path.join(root, relativePath)));
if (missing.length) {
  console.error(`[kai-remote] Build thiếu file:\n${missing.map((item) => `- ${item}`).join("\n")}`);
  process.exit(1);
}

const html = fs.readFileSync(path.join(root, "remote-control-app/dist/index.html"), "utf8");
const assetReferences = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((value) => value.startsWith("/assets/"));
const missingAssets = assetReferences.filter((value) => !fs.existsSync(path.join(root, "remote-control-app/dist", value.slice(1))));
if (missingAssets.length) {
  console.error(`[kai-remote] Renderer thiếu asset:\n${missingAssets.map((item) => `- ${item}`).join("\n")}`);
  process.exit(1);
}

console.log(`[kai-remote] Build verified (${assetReferences.length} renderer assets).`);
