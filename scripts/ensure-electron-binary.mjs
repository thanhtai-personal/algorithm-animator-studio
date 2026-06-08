import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const electronDir = path.join(root, "node_modules", "electron");
const pathTxt = path.join(electronDir, "path.txt");
const installScript = path.join(electronDir, "install.js");
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

const skipDownloadEnvKeys = [
  "ELECTRON_SKIP_BINARY_DOWNLOAD",
  "electron_skip_binary_download",
  "npm_config_electron_skip_binary_download",
  "NPM_CONFIG_ELECTRON_SKIP_BINARY_DOWNLOAD",
  "npm_package_config_electron_skip_binary_download",
  "npm_config_ELECTRON_SKIP_BINARY_DOWNLOAD",
];

function createInstallEnv() {
  const env = { ...process.env };
  for (const key of skipDownloadEnvKeys) delete env[key];
  env.npm_config_ignore_scripts = "false";
  env.npm_config_foreground_scripts = "true";
  env.npm_config_audit = "false";
  env.npm_config_fund = "false";
  return env;
}

function log(message) {
  console.log(`[electron-binary] ${message}`);
}

function run(command, args, options = {}) {
  log(`$ ${[command, ...args].join(" ")}`);
  return spawnSync(command, args, {
    cwd: root,
    env: createInstallEnv(),
    stdio: options.stdio ?? "inherit",
    windowsHide: true,
    shell: false,
  });
}

function fail(message, error) {
  console.error(`\n[electron-binary] ${message}`);
  if (error) console.error(error.trim ? error.trim() : error);
  console.error("\nChẩn đoán nhanh:");
  console.error("  npm config get ignore-scripts");
  console.error("  npm config get electron_skip_binary_download");
  console.error("  node -p \"require('./node_modules/electron/package.json').version\"");
  console.error("  dir node_modules\\electron");
  console.error("\nThử chạy một trong các lệnh sau:");
  console.error("  set ELECTRON_SKIP_BINARY_DOWNLOAD=");
  console.error("  set npm_config_electron_skip_binary_download=");
  console.error("  set npm_config_ignore_scripts=false");
  console.error("  npm config set ignore-scripts false");
  console.error("  npm install electron --save-dev --ignore-scripts=false --foreground-scripts");
  console.error("  node node_modules\\electron\\install.js");
  console.error("\nNếu mạng GitHub tải Electron chậm/bị chặn, thử thêm mirror tạm thời:");
  console.error("  set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/");
  console.error("  npm run electron:install");
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

function readElectronVersion() {
  const packageJsonPath = path.join(electronDir, "package.json");
  if (!fs.existsSync(packageJsonPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(packageJsonPath, "utf8")).version;
  } catch {
    return null;
  }
}

function runElectronInstallScript(label) {
  if (!fs.existsSync(installScript)) return false;
  log(`${label}: chạy node_modules/electron/install.js...`);
  const result = run(process.execPath, [installScript]);
  return result.status === 0;
}

function verifyInstalled() {
  const installed = readElectronBinaryPath();
  if (installed) {
    log(`OK: ${installed}`);
    process.exit(0);
  }
}

if (!fs.existsSync(electronDir)) {
  fail("Chưa có node_modules/electron. Hãy chạy npm install trước.");
}

verifyInstalled();

if (!fs.existsSync(installScript)) {
  fail(`Không tìm thấy ${installScript}. Hãy cài lại node_modules.`);
}

log("Chưa có node_modules/electron/path.txt, đang tải/cài lại Electron binary...");
log("Đã bỏ các biến môi trường skip download của Electron nếu có.");

runElectronInstallScript("Lần 1");
verifyInstalled();

const version = readElectronVersion();
const packageName = version ? `electron@${version}` : "electron";
log(`Install script chưa tạo path.txt. Thử cài lại ${packageName} với lifecycle scripts bật rõ ràng...`);
const reinstall = run(npmCmd, [
  "install",
  packageName,
  "--save-dev",
  "--ignore-scripts=false",
  "--foreground-scripts",
  "--no-audit",
  "--no-fund",
]);

if (reinstall.status !== 0) {
  fail(`npm install ${packageName} thất bại với code ${reinstall.status ?? "unknown"}.`);
}

verifyInstalled();

runElectronInstallScript("Lần 2");
verifyInstalled();

fail("Đã thử install.js và npm install electron nhưng vẫn chưa thấy Electron binary/path.txt.");
