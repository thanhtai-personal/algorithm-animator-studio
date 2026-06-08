const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const fs = require("node:fs");
const http = require("node:http");
const net = require("node:net");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { ensureDesktopRuntime } = require("./runtime-bootstrap.cjs");

let mainWindow;
let setupWindow;
let clientServer;

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
}

const DEFAULT_CLIENT_PORT = 3000;
const DEFAULT_SERVER_PORT = 5050;
const DESKTOP_ENV_JSON = "desktop-env.json";

const RUNTIME_ENV_KEYS = [
  "PORT",
  "SERVER_ORIGIN",
  "CLIENT_ORIGIN",
  "VITE_API_URL",
  "VITE_PUBLIC_WEB",
  "VITE_NEST_API_BASE_URL",
  "SUPERTONIC_BASE_URL",
  "SUPERTONIC_MODEL",
  "SUPERTONIC_HEALTH_ENDPOINT",
  "SUPERTONIC_STYLES_ENDPOINT",
  "SUPERTONIC_IMPORT_STYLE_ENDPOINT",
  "SUPERTONIC_TTS_ENDPOINT",
  "RVC_APPLIO_BASE_URL",
  "RVC_APPLIO_START_COMMAND",
  "RVC_APPLIO_API_NAME",
  "RVC_APPLIO_PYTHON",
  "VIENEU_SOURCE_DIR",
  "VIENEU_PYTHON",
  "VIENEU_START_MODE",
  "VIENEU_AUTO_START",
  "VIENEU_MODE",
  "VIENEU_EMOTION",
  "VIENEU_DEFAULT_VOICE_ID",
  "VIENEU_REFERENCE_AUDIO",
  "VIENEU_REFERENCE_TEXT",
  "VIENEU_REMOTE_API_BASE",
  "VIENEU_REMOTE_MODEL",
  "VIENEU_TIMEOUT_MS",
];

function normalizeBaseUrl(value, fallback) {
  const trimmed = String(value || "").trim().replace(/\/+$/, "");
  return trimmed || fallback;
}

function parseEnvText(raw) {
  const env = {};
  for (const line of String(raw || "").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equalIndex = trimmed.indexOf("=");
    if (equalIndex <= 0) continue;
    const key = trimmed.slice(0, equalIndex).trim();
    let value = trimmed.slice(equalIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function applyRuntimeEnv(values, sourceLabel, options = {}) {
  let applied = 0;
  for (const [key, value] of Object.entries(values || {})) {
    if (!RUNTIME_ENV_KEYS.includes(key)) continue;
    if (value === undefined || value === null || String(value).trim() === "") continue;
    if (!options.override && process.env[key] !== undefined && process.env[key] !== "") continue;
    process.env[key] = String(value);
    applied += 1;
  }
  if (applied) console.log(`[desktop] Loaded ${applied} runtime env values from ${sourceLabel}`);
}

function loadEnvFileIfExists(filePath, options = {}) {
  if (!filePath || !fs.existsSync(filePath)) return;
  try {
    applyRuntimeEnv(parseEnvText(fs.readFileSync(filePath, "utf8")), filePath, options);
  } catch (error) {
    console.warn(`[desktop] Không đọc được env file ${filePath}:`, error);
  }
}

function loadDesktopEnvJsonIfExists(filePath, options = {}) {
  if (!filePath || !fs.existsSync(filePath)) return;
  try {
    applyRuntimeEnv(JSON.parse(fs.readFileSync(filePath, "utf8")), filePath, options);
  } catch (error) {
    console.warn(`[desktop] Không đọc được ${DESKTOP_ENV_JSON} tại ${filePath}:`, error);
  }
}

function loadDesktopRuntimeEnv() {
  const appRoot = getAppRoot();
  const resourceRoot = getDesktopRuntimeResourceRoot();

  loadEnvFileIfExists(path.resolve(process.cwd(), ".env"));
  loadEnvFileIfExists(path.join(appRoot, ".env"));
  loadEnvFileIfExists(path.join(resourceRoot, ".env"));
  loadDesktopEnvJsonIfExists(path.join(appRoot, "dist-electron", DESKTOP_ENV_JSON));
  loadDesktopEnvJsonIfExists(path.join(resourceRoot, DESKTOP_ENV_JSON));
  loadEnvFileIfExists(path.join(app.getPath("userData"), ".env"), { override: true });
}

function getServerOrigin() {
  return normalizeBaseUrl(
    process.env.SERVER_ORIGIN || process.env.VITE_API_URL,
    `http://127.0.0.1:${process.env.PORT || DEFAULT_SERVER_PORT}`
  );
}

function getClientOrigin() {
  return normalizeBaseUrl(
    process.env.CLIENT_ORIGIN || process.env.VITE_CLIENT_ORIGIN,
    `http://127.0.0.1:${DEFAULT_CLIENT_PORT}`
  );
}

function getPortFromUrl(origin, fallback) {
  try {
    const url = new URL(origin);
    if (url.port) return Number(url.port);
    if (url.protocol === "https:") return 443;
    if (url.protocol === "http:") return 80;
  } catch {
    // fall through
  }
  return fallback;
}

function getServerPort() {
  return Number(process.env.PORT || getPortFromUrl(getServerOrigin(), DEFAULT_SERVER_PORT));
}

function getClientPort() {
  return getPortFromUrl(getClientOrigin(), DEFAULT_CLIENT_PORT);
}

function getAppRoot() {
  if (!app.isPackaged) return path.resolve(__dirname, "..");

  const asarRoot = path.join(process.resourcesPath, "app.asar");
  return fs.existsSync(asarRoot) ? asarRoot : path.join(process.resourcesPath, "app");
}

function getDesktopRuntimeResourceRoot() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "electron-runtime")
    : path.resolve(__dirname, "..");
}

function getWindowIconPath() {
  const candidates = [
    path.join(getAppRoot(), "assets", "app-icon.png"),
    path.join(getAppRoot(), "public", "favicon.ico"),
    path.join(process.resourcesPath || "", "favicon.ico"),
  ];
  return candidates.find((candidate) => candidate && fs.existsSync(candidate));
}

function getDesktopClientDir() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "desktop-client")
    : path.join(getAppRoot(), "dist");
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

async function waitUntilPortFree(port, label) {
  if (await isPortFree(port)) return;
  throw new Error(`${label} port ${port} đang được sử dụng. Hãy đóng app/dev server cũ hoặc kill process đang chiếm port này.`);
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".html": return "text/html; charset=utf-8";
    case ".js":
    case ".mjs": return "text/javascript; charset=utf-8";
    case ".css": return "text/css; charset=utf-8";
    case ".json":
    case ".map": return "application/json; charset=utf-8";
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".webp": return "image/webp";
    case ".gif": return "image/gif";
    case ".svg": return "image/svg+xml; charset=utf-8";
    case ".ico": return "image/x-icon";
    case ".webmanifest": return "application/manifest+json; charset=utf-8";
    case ".wasm": return "application/wasm";
    case ".txt": return "text/plain; charset=utf-8";
    default: return "application/octet-stream";
  }
}

function isStaticAssetRequest(urlPath) {
  if (urlPath.startsWith("/assets/")) return true;
  if (urlPath === "/favicon.ico") return true;
  if (urlPath === "/manifest.webmanifest") return true;
  if (urlPath === "/registerSW.js") return true;
  if (urlPath === "/sw.js") return true;
  if (urlPath.startsWith("/workbox-")) return true;
  return /\.(?:js|mjs|css|map|json|png|jpg|jpeg|webp|gif|svg|ico|txt|webmanifest|wasm)$/i.test(urlPath);
}

function sendFile(res, filePath) {
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
      res.end("File not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": getContentType(filePath),
      "Cache-Control": "no-store",
    });
    res.end(data);
  });
}

async function startClientServer() {
  const clientDir = getDesktopClientDir();
  const indexHtml = path.join(clientDir, "index.html");

  if (!fs.existsSync(indexHtml)) {
    throw new Error(`Không tìm thấy Vite desktop build tại ${indexHtml}. Hãy chạy npm run build:desktop trước khi mở Electron.`);
  }

  const clientPort = getClientPort();
  await waitUntilPortFree(clientPort, "Client");

  clientServer = http.createServer((req, res) => {
    const requestUrl = new URL(req.url || "/", `http://127.0.0.1:${clientPort}`);
    let pathname = decodeURIComponent(requestUrl.pathname);

    // Một số build cũ từng tạo lỗi /assets/assets/*.js. Không redirect, trả 404 rõ ràng để dễ bắt lỗi.
    if (pathname.startsWith("/assets/assets/")) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
      res.end(`Invalid duplicated assets path: ${pathname}`);
      return;
    }

    const relativePath = pathname.replace(/^\/+/, "");
    const safeRelativePath = relativePath || "index.html";
    const requestedPath = path.resolve(clientDir, safeRelativePath);

    if (!requestedPath.startsWith(clientDir + path.sep) && requestedPath !== clientDir) {
      res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Invalid path");
      return;
    }

    if (fs.existsSync(requestedPath) && fs.statSync(requestedPath).isFile()) {
      sendFile(res, requestedPath);
      return;
    }

    if (isStaticAssetRequest(pathname)) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
      res.end(`Static asset not found: ${pathname}`);
      return;
    }

    sendFile(res, indexHtml);
  });

  await new Promise((resolve, reject) => {
    clientServer.once("error", reject);
    clientServer.listen(clientPort, "127.0.0.1", () => {
      clientServer?.off("error", reject);
      console.log(`[desktop] Client running at ${getClientOrigin()}`);
      console.log(`[desktop] Client dir: ${clientDir}`);
      resolve();
    });
  });
}

function waitForBackendReady(baseUrl, timeoutMs = 12000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const ping = () => {
      const healthUrl = new URL("/api/health", baseUrl);
      const request = http.get(healthUrl, (response) => {
        response.resume();
        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 500) {
          resolve();
          return;
        }
        retry();
      });

      request.on("error", retry);
      request.setTimeout(1200, () => {
        request.destroy();
        retry();
      });
    };

    const retry = () => {
      if (Date.now() - startedAt > timeoutMs) {
        reject(new Error(`App-server local chưa sẵn sàng sau ${Math.round(timeoutMs / 1000)} giây.`));
        return;
      }
      setTimeout(ping, 250);
    };

    ping();
  });
}

async function isBackendReady(baseUrl, timeoutMs = 2200) {
  try {
    await waitForBackendReady(baseUrl, timeoutMs);
    return true;
  } catch {
    return false;
  }
}

function createSetupWindow() {
  setupWindow = new BrowserWindow({
    width: 860,
    height: 760,
    minWidth: 720,
    minHeight: 620,
    resizable: true,
    autoHideMenuBar: true,
    show: false,
    backgroundColor: "#070717",
    icon: getWindowIconPath(),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  setupWindow.loadFile(path.join(__dirname, "setup.html"));
  setupWindow.once("ready-to-show", () => setupWindow?.show());
  return setupWindow;
}

function sendSetupStatus(payload) {
  if (setupWindow && !setupWindow.isDestroyed()) {
    setupWindow.webContents.send("runtime-setup-status", payload);
  }
}

function waitForSetupContinue() {
  return new Promise((resolve) => {
    if (!setupWindow || setupWindow.isDestroyed()) {
      resolve();
      return;
    }

    const done = () => {
      ipcMain.removeListener("runtime-setup-continue", done);
      resolve();
    };

    ipcMain.once("runtime-setup-continue", done);
    setupWindow.once("closed", done);
  });
}

function requestJson(method, baseUrl, pathname) {
  const target = new URL(pathname, baseUrl);

  return new Promise((resolve, reject) => {
    const request = http.request(target, { method, headers: { "Content-Type": "application/json" } }, (response) => {
      let raw = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { raw += chunk; });
      response.on("end", () => {
        let payload = {};
        if (raw.trim()) {
          try {
            payload = JSON.parse(raw);
          } catch (error) {
            reject(new Error(`Phản hồi setup không phải JSON: ${raw.slice(0, 300)}`));
            return;
          }
        }

        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
          resolve(payload);
          return;
        }

        reject(new Error(payload.error || `HTTP ${response.statusCode || 500}: ${raw.slice(0, 300)}`));
      });
    });

    request.on("error", reject);
    request.setTimeout(90 * 60 * 1000, () => {
      request.destroy(new Error(`Setup request timeout: ${method} ${pathname}`));
    });
    request.end();
  });
}

function summarizeSetupTask(task, state, extra = {}) {
  return {
    id: task.id,
    label: task.label,
    optional: Boolean(task.optional),
    command: task.command || "",
    detail: task.detail || "",
    state,
    ...extra,
  };
}

async function runBackendSetupWizard(baseUrl) {
  sendSetupStatus({
    kind: "section",
    step: "health-setup",
    status: "running",
    message: "Đang kiểm tra và tự khởi động các service local đã có sẵn...",
  });

  try {
    const autostart = await requestJson("POST", baseUrl, "/api/setup/autostart");
    const started = autostart.started?.length || 0;
    const skipped = autostart.skipped?.length || 0;
    const failed = autostart.failed?.length || 0;
    sendSetupStatus({
      kind: "section",
      step: "autostart",
      status: failed ? "warning" : "done",
      message: `Autostart: ${started} started · ${skipped} skipped · ${failed} failed.`,
    });
  } catch (error) {
    sendSetupStatus({
      kind: "section",
      step: "autostart",
      status: "warning",
      message: `Không chạy được autostart service local: ${error instanceof Error ? error.message : String(error)}`,
    });
  }

  const status = await requestJson("GET", baseUrl, "/api/setup/status");
  const taskCards = (status.tasks || [])
    .filter((task) => task.id !== "elevenlabs")
    .map((task) => summarizeSetupTask(task, task.ready ? "success" : task.canAutoFix ? "pending" : "skipped"));

  const missingAutoFix = taskCards.filter((task) => task.state === "pending").length;
  const skipped = taskCards.filter((task) => task.state === "skipped").length;

  sendSetupStatus({
    kind: "task-list",
    step: "health-setup",
    status: status.coreReady ? "done" : "warning",
    message: missingAutoFix
      ? `Còn ${missingAutoFix} mục chưa sẵn sàng. App không tự cài thêm khi mở; vào Health Check và bấm Tự cài đặt nếu muốn cài.`
      : "Các service tự động đã sẵn sàng hoặc được bỏ qua theo cấu hình.",
    tasks: taskCards,
  });

  sendSetupStatus({
    kind: "summary",
    step: "health-setup",
    status: status.coreReady ? "done" : "warning",
    message: status.coreReady
      ? "Hoàn tất kiểm tra runtime. Bạn có thể vào Studio."
      : "Runtime core còn thiếu. Vào Studio sẽ được đưa tới Health Check để bấm Tự cài đặt hoặc xem lỗi chi tiết.",
    summary: {
      success: taskCards.filter((task) => task.state === "success").length,
      failed: 0,
      skipped,
    },
  });
}

function focusMainWindow() {
  const target = mainWindow || setupWindow;
  if (!target || target.isDestroyed()) return;
  if (target.isMinimized()) target.restore();
  target.focus();
}

async function startBackend(runtime) {
  const userData = app.getPath("userData");
  const serverDataDir = path.join(userData, "server-data");
  fs.mkdirSync(serverDataDir, { recursive: true });

  const desktopRuntimeResourceRoot = getDesktopRuntimeResourceRoot();

  const serverOrigin = getServerOrigin();
  const serverPort = getPortFromUrl(serverOrigin, getServerPort());
  const clientOrigin = getClientOrigin();

  if (!(await isPortFree(serverPort))) {
    if (await isBackendReady(serverOrigin, 2200)) {
      console.log(`[desktop] Reusing existing local app-server at ${serverOrigin}`);
      return;
    }
    throw new Error(`Backend port ${serverPort} đang bị chiếm nhưng /api/health không phản hồi. Hãy đóng process đang chiếm port này rồi mở lại app.`);
  }

  process.env.KATA_DESKTOP_RUNTIME = "true";
  process.env.KATA_STUDIO_HOME = runtime.runtimeHome;
  process.env.KATA_DESKTOP_RESOURCE_ROOT = desktopRuntimeResourceRoot;
  process.env.KATA_PROJECT_ROOT = desktopRuntimeResourceRoot;
  process.env.PORT = String(serverPort);
  process.env.SERVER_ORIGIN = serverOrigin;
  process.env.CLIENT_ORIGIN = clientOrigin;
  process.env.SERVER_DATA_DIR = process.env.SERVER_DATA_DIR || serverDataDir;
  process.env.MODEL_DIR = process.env.MODEL_DIR || runtime.modelDir;
  process.env.PIPER_EXE = process.env.PIPER_EXE || runtime.piperExe;

  const bundledVieneuSource = path.join(desktopRuntimeResourceRoot, "libs", "VieNeu-TTS");
  if (fs.existsSync(bundledVieneuSource)) {
    process.env.VIENEU_SOURCE_DIR = process.env.VIENEU_SOURCE_DIR || bundledVieneuSource;
  }

  if (runtime.ffmpegExe) process.env.FFMPEG_EXE = process.env.FFMPEG_EXE || runtime.ffmpegExe;
  if (runtime.ffprobeExe) process.env.FFPROBE_EXE = process.env.FFPROBE_EXE || runtime.ffprobeExe;

  const serverEntry = path.join(getAppRoot(), "dist-electron", "server", "index.js");
  await import(pathToFileURL(serverEntry).href);
  await waitForBackendReady(process.env.SERVER_ORIGIN);
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    show: false,
    backgroundColor: "#070717",
    autoHideMenuBar: true,
    icon: getWindowIconPath(),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow?.show());
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (!app.isPackaged && process.env.ELECTRON_DEV_URL) {
    mainWindow.loadURL(process.env.ELECTRON_DEV_URL);
    return;
  }

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    console.error(`[desktop] Không load được UI: ${errorCode} ${errorDescription} ${validatedURL}`);
  });
  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    console.error("[desktop] Renderer bị dừng:", details);
  });
  mainWindow.webContents.on("did-finish-load", () => {
    console.log(`[desktop] UI đã load: ${mainWindow?.webContents.getURL()}`);
  });

  mainWindow.loadURL(getClientOrigin());
}

app.setAppUserModelId("vn.kaistudio.app");

app.on("second-instance", () => {
  focusMainWindow();
});

app.whenReady().then(async () => {
  loadDesktopRuntimeEnv();

  try {
    const { session } = require("electron");
    await session.defaultSession.clearStorageData({ storages: ["serviceworkers", "cachestorage"] });
  } catch (error) {
    console.warn("[desktop] Không thể xóa cache/service worker cũ:", error);
  }

  const setup = createSetupWindow();

  try {
    const runtime = await ensureDesktopRuntime({
      appDataDir: app.getPath("userData"),
      onStatus: sendSetupStatus,
    });

    sendSetupStatus({ step: "backend", status: "running", message: "Đang khởi động app-server local..." });
    await startBackend(runtime);
    await runBackendSetupWizard(process.env.SERVER_ORIGIN);
    sendSetupStatus({ step: "client", status: "running", message: `Đang khởi động client local ở ${getClientOrigin()}...` });
    await startClientServer();
    sendSetupStatus({ kind: "ready", step: "ready", status: "done", message: "Sẵn sàng. Bấm Vào Studio để bắt đầu làm việc." });

    await waitForSetupContinue();
    createMainWindow();
    setTimeout(() => {
      if (setup && !setup.isDestroyed()) setup.close();
    }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    sendSetupStatus({ step: "error", status: "error", message });
    dialog.showErrorBox("Không thể chuẩn bị môi trường chạy", message);
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("before-quit", () => {
  if (clientServer) {
    clientServer.close();
    clientServer = undefined;
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
