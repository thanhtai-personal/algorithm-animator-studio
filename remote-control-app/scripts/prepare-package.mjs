import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const appDirectory = path.join(root, "remote-control-app");
const stageDirectory = path.join(appDirectory, "dist-package");
const rootPackage = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

const sources = [
  "remote-control-app/dist",
  "remote-control-app/dist-server/index.cjs",
  "remote-control-app/electron/main.cjs",
  "remote-control-app/electron/preload.cjs",
  "public/favicon.ico",
];

for (const relativePath of sources) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    throw new Error(`Không thể chuẩn bị KAI Remote package: thiếu ${relativePath}`);
  }
}

fs.rmSync(stageDirectory, { recursive: true, force: true });
fs.mkdirSync(path.join(stageDirectory, "electron"), { recursive: true });
fs.mkdirSync(path.join(stageDirectory, "dist-server"), { recursive: true });
fs.mkdirSync(path.join(stageDirectory, "public"), { recursive: true });

fs.cpSync(path.join(appDirectory, "dist"), path.join(stageDirectory, "remote-client"), { recursive: true });
fs.copyFileSync(path.join(appDirectory, "electron/main.cjs"), path.join(stageDirectory, "electron/main.cjs"));
fs.copyFileSync(path.join(appDirectory, "electron/preload.cjs"), path.join(stageDirectory, "electron/preload.cjs"));
fs.copyFileSync(path.join(appDirectory, "dist-server/index.cjs"), path.join(stageDirectory, "dist-server/index.cjs"));
fs.copyFileSync(path.join(root, "public/favicon.ico"), path.join(stageDirectory, "public/favicon.ico"));

const remotePackage = {
  name: "kai-remote",
  version: rootPackage.version || "0.0.0",
  private: true,
  description: "Standalone Telegram remote control tray app for KAI STUDIO.",
  author: rootPackage.author || "KAI STUDIO",
  main: "electron/main.cjs",
};
fs.writeFileSync(path.join(stageDirectory, "package.json"), `${JSON.stringify(remotePackage, null, 2)}\n`);
fs.writeFileSync(path.join(stageDirectory, "package-lock.json"), `${JSON.stringify({
  name: remotePackage.name,
  version: remotePackage.version,
  lockfileVersion: 3,
  requires: true,
  packages: {
    "": {
      name: remotePackage.name,
      version: remotePackage.version,
    },
  },
}, null, 2)}\n`);

console.log(`[kai-remote] Minimal package staged at ${stageDirectory}`);
