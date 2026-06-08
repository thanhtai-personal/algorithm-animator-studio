import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const electronDir = path.join(root, "node_modules", "electron");
const pathTxt = path.join(electronDir, "path.txt");
const installScript = path.join(electronDir, "install.js");

const skipDownloadEnvKeys = [
  "ELECTRON_SKIP_BINARY_DOWNLOAD",
  "npm_config_electron_skip_binary_download",
  "NPM_CONFIG_ELECTRON_SKIP_BINARY_DOWNLOAD",
  "npm_package_config_electron_skip_binary_download",
];

function createInstallEnv() {
  const env = { ...process.env };
  for (const key of skipDownloadEnvKeys) delete env[key];
  env.npm_config_ignore_scripts = "false";
  return env;
}

function log(message) {
  console.log(`[electron-binary] ${message}`);
}

function fail(message, error) {
  console.error(`\n[electron-binary] ${message}`);
  if (error) console.error(error.trim ? error.trim() : error);
  console.error("\nThử chạy một trong các lệnh sau:");
  console.error("  set ELECTRON_SKIP_BINARY_DOWNLOAD=");
  console.error("  set npm_config_electron_skip_binary_download=");
  console.error("  npm rebuild electron");
  console.error("  node node_modules/electron/install.js");
  console.error("  rmdir /s /q node_modules\\electron && npm install");
  process.exit(1);
}

function readElectronBinaryPath() {
  if (!fs.existsSync(pathTxt)) return null;
  const relativePath = fs.readFileSync(pathTxt, "utf8").trim();
  if (!relativePath) return null;
  const binaryPath = path.isAbsolute(relativePath)
    ? relativePath
    : path.join(electronDir, relativePath);
  return fs.existsSync(binaryPath) ? binaryPath : null;
}

if (!fs.existsSync(electronDir)) {
  fail("Chưa có node_modules/electron. Hãy chạy npm install trước.");
}

const existing = readElectronBinaryPath();
if (existing) {
  log(`OK: ${existing}`);
  process.exit(0);
}

if (!fs.existsSync(installScript)) {
  fail(`Không tìm thấy ${installScript}. Hãy cài lại node_modules.`);
}

log("Chưa có node_modules/electron/path.txt, đang tải/cài lại Electron binary...");
log("Đã bỏ các biến môi trường skip download của Electron nếu có.");

const result = spawnSync(process.execPath, [installScript], {
  cwd: root,
  env: createInstallEnv(),
  stdio: "inherit",
  windowsHide: true,
});

if (result.status !== 0) {
  fail(`Electron install script thất bại với code ${result.status ?? "unknown"}.`);
}

const installed = readElectronBinaryPath();
if (!installed) {
  fail("Đã chạy install.js nhưng vẫn chưa thấy Electron binary/path.txt.");
}

log(`OK sau khi cài lại: ${installed}`);
