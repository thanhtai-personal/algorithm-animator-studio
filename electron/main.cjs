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
  "VITE_CLIENT_ORIGIN",
  "VITE_API_URL",
  "VITE_PUBLIC_WEB",
  "KATA_STUDIO_HOME",
  "MODEL_DIR",
  "PIPER_EXE",
  "SERVER_DATA_DIR",
  "MUSIC_LIBRARY_DIR",
  "FFMPEG_EXE",
  "FFPROBE_EXE",
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

function getDefaultRuntimeHome() {
  const configured = process.env.KATA_STUDIO_HOME?.trim();
  if (configured) return path.resolve(configured);
  if (process.platform === "win32" && process.env.LOCALAPPDATA) return path.join(process.env.LOCALAPPDATA, "KAI STUDIO");
  return path.join(app.getPath("userData"), "runtime");
}

function getDefaultModelDir() {
  return path.resolve(process.env.MODEL_DIR || path.join(getDefaultRuntimeHome(), "models"));
}

function getDefaultServerDataDir() {
  return path.resolve(process.env.SERVER_DATA_DIR || path.join(getDefaultRuntimeHome(), "server-data"));
}

function derivePiperExe(modelDir) {
  const scriptsDir = process.platform === "win32" ? "Scripts" : "bin";
  const executableName = process.platform === "win32" ? "piper.exe" : "piper";
  return path.join(path.resolve(modelDir || getDefaultModelDir()), ".venv", scriptsDir, executableName);
}

function getSetupInitialConfig() {
  const modelDir = getDefaultModelDir();
  const serverDataDir = getDefaultServerDataDir();
  return {
    KATA_STUDIO_HOME: getDefaultRuntimeHome(),
    MODEL_DIR: modelDir,
    PIPER_EXE: process.env.PIPER_EXE || derivePiperExe(modelDir),
    SERVER_DATA_DIR: serverDataDir,
    SERVER_ORIGIN: getServerOrigin(),
    CLIENT_ORIGIN: getClientOrigin(),
    VITE_API_URL: process.env.VITE_API_URL || getServerOrigin(),
    VITE_PUBLIC_WEB: process.env.VITE_PUBLIC_WEB || "false",
    SUPERTONIC_BASE_URL: process.env.SUPERTONIC_BASE_URL || "http://127.0.0.1:6688",
    SUPERTONIC_MODEL: process.env.SUPERTONIC_MODEL || "supertonic-3",
    RVC_APPLIO_BASE_URL: process.env.RVC_APPLIO_BASE_URL || "http://127.0.0.1:6969",
    RVC_APPLIO_START_COMMAND: process.env.RVC_APPLIO_START_COMMAND || "",
    RVC_APPLIO_API_NAME: process.env.RVC_APPLIO_API_NAME || "/infer_convert",
    RVC_APPLIO_PYTHON: process.env.RVC_APPLIO_PYTHON || ".venv/Scripts/python.exe",
    VIENEU_SOURCE_DIR: process.env.VIENEU_SOURCE_DIR || "libs/VieNeu-TTS",
    VIENEU_PYTHON: process.env.VIENEU_PYTHON || ".venv/Scripts/python.exe",
    VIENEU_START_MODE: process.env.VIENEU_START_MODE || "bridge",
    VIENEU_AUTO_START: process.env.VIENEU_AUTO_START || "true",
    VIENEU_MODE: process.env.VIENEU_MODE || "turbo",
    VIENEU_EMOTION: process.env.VIENEU_EMOTION || "natural",
    VIENEU_REMOTE_API_BASE: process.env.VIENEU_REMOTE_API_BASE || "http://127.0.0.1:23333/v1",
    VIENEU_REMOTE_MODEL: process.env.VIENEU_REMOTE_MODEL || "pnnbao-ump/VieNeu-TTS-v2",
    VIENEU_TIMEOUT_MS: process.env.VIENEU_TIMEOUT_MS || "1200000",
  };
}

function normalizeSetupConfig(values = {}) {
  const defaults = getSetupInitialConfig();
  const output = { ...defaults };
  for (const key of RUNTIME_ENV_KEYS) {
    if (values[key] !== undefined && values[key] !== null && String(values[key]).trim() !== "") {
      output[key] = String(values[key]).trim();
    }
  }
  output.MODEL_DIR = path.resolve(output.MODEL_DIR || defaults.MODEL_DIR);
  output.SERVER_DATA_DIR = path.resolve(output.SERVER_DATA_DIR || defaults.SERVER_DATA_DIR);
  output.KATA_STUDIO_HOME = path.resolve(output.KATA_STUDIO_HOME || path.dirname(output.MODEL_DIR));
  output.PIPER_EXE = output.PIPER_EXE || derivePiperExe(output.MODEL_DIR);
  output.SERVER_ORIGIN = normalizeBaseUrl(output.SERVER_ORIGIN || output.VITE_API_URL, `http://127.0.0.1:${DEFAULT_SERVER_PORT}`);
  output.VITE_API_URL = normalizeBaseUrl(output.VITE_API_URL || output.SERVER_ORIGIN, output.SERVER_ORIGIN);
  output.CLIENT_ORIGIN = normalizeBaseUrl(output.CLIENT_ORIGIN, `http://127.0.0.1:${DEFAULT_CLIENT_PORT}`);
  output.VITE_CLIENT_ORIGIN = output.CLIENT_ORIGIN;
  return output;
}

function serializeEnv(values) {
  return `${Object.entries(values)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "")
    .map(([key, value]) => `${key}=${String(value).replace(/\r?\n/g, " ")}`)
    .join("\n")}\n`;
}

function persistSetupConfig(values) {
  const normalized = normalizeSetupConfig(values);
  fs.mkdirSync(app.getPath("userData"), { recursive: true });
  fs.mkdirSync(normalized.KATA_STUDIO_HOME, { recursive: true });
  fs.mkdirSync(normalized.MODEL_DIR, { recursive: true });
  fs.mkdirSync(normalized.SERVER_DATA_DIR, { recursive: true });

  const envText = serializeEnv(normalized);
  fs.writeFileSync(path.join(app.getPath("userData"), ".env"), envText, "utf8");
  fs.writeFileSync(path.join(normalized.KATA_STUDIO_HOME, ".env"), envText, "utf8");
  applyRuntimeEnv(normalized, "first-run setup", { override: true });
  return normalized;
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

function shouldProxyToBackend(pathname) {
  return pathname === "/api"
    || pathname.startsWith("/api/")
    || pathname === "/generated"
    || pathname.startsWith("/generated/")
    || pathname === "/generated-previews"
    || pathname.startsWith("/generated-previews/")
    || pathname === "/generated-videos"
    || pathname.startsWith("/generated-videos/")
    || pathname === "/background-music"
    || pathname.startsWith("/background-music/");
}

function proxyToBackend(req, res, requestUrl) {
  const target = new URL(`${requestUrl.pathname}${requestUrl.search}`, getServerOrigin());
  const headers = { ...req.headers, host: target.host };
  delete headers.connection;
  delete headers["proxy-connection"];
  delete headers["transfer-encoding"];

  const proxyReq = http.request(target, {
    method: req.method || "GET",
    headers,
  }, (proxyRes) => {
    const responseHeaders = { ...proxyRes.headers };
    delete responseHeaders["transfer-encoding"];
    res.writeHead(proxyRes.statusCode || 502, responseHeaders);
    proxyRes.pipe(res);
  });

  proxyReq.on("error", (error) => {
    if (res.headersSent) {
      res.destroy(error);
      return;
    }

    res.writeHead(502, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    res.end(JSON.stringify({
      error: "Desktop backend proxy failed",
      detail: error.message,
      target: target.toString(),
    }));
  });

  req.pipe(proxyReq);
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

    // API và generated assets luôn thuộc backend local. Khi desktop client chạy ở localhost:3000
    // mà frontend dùng URL tương đối (/api/...), cần proxy sang backend thật (mặc định 5050).
    if (shouldProxyToBackend(pathname)) {
      proxyToBackend(req, res, requestUrl);
      return;
    }

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


function registerSetupIpcHandlers() {
  ipcMain.handle("runtime-setup-initial-config", () => getSetupInitialConfig());
  ipcMain.handle("runtime-setup-select-directory", async (_event, currentPath) => {
    const result = await dialog.showOpenDialog(setupWindow || undefined, {
      title: "Chọn thư mục",
      defaultPath: String(currentPath || getDefaultRuntimeHome()),
      properties: ["openDirectory", "createDirectory"],
    });
    return result.canceled ? "" : result.filePaths[0] || "";
  });
}

function waitForSetupConfig() {
  return new Promise((resolve) => {
    const done = (_event, values) => {
      ipcMain.removeListener("runtime-setup-save-config", done);
      try {
        const normalized = persistSetupConfig(values || {});
        sendSetupStatus({ kind: "config-saved", message: "Đã lưu cấu hình. Bắt đầu cài đặt service local...", config: normalized });
        resolve(normalized);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        sendSetupStatus({ kind: "config-error", message });
        ipcMain.once("runtime-setup-save-config", done);
      }
    };
    ipcMain.once("runtime-setup-save-config", done);
  });
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
    message: "Đang kiểm tra danh sách service cần cài đặt...",
  });

  const firstStatus = await requestJson("GET", baseUrl, "/api/setup/status");
  const initialTasks = (firstStatus.tasks || [])
    .filter((task) => task.id !== "elevenlabs")
    .map((task) => summarizeSetupTask(task, task.ready ? "success" : task.canAutoFix ? "pending" : "skipped"));

  sendSetupStatus({
    kind: "task-list",
    step: "health-setup",
    status: "running",
    message: "Đang cài đặt các service/model còn thiếu. Task nào đã sẵn sàng sẽ được bỏ qua.",
    tasks: initialTasks,
  });

  const results = [];

  for (const task of firstStatus.tasks || []) {
    if (task.id === "elevenlabs") continue;

    if (task.ready) {
      const skippedReady = summarizeSetupTask(task, "success", { message: "Đã sẵn sàng, bỏ qua cài đặt." });
      results.push(skippedReady);
      sendSetupStatus({ kind: "task-update", task: skippedReady });
      continue;
    }

    if (!task.canAutoFix) {
      const skipped = summarizeSetupTask(task, "skipped", { message: task.detail || "Chưa đủ cấu hình để tự cài." });
      results.push(skipped);
      sendSetupStatus({ kind: "task-update", task: skipped });
      continue;
    }

    sendSetupStatus({
      kind: "task-update",
      task: summarizeSetupTask(task, "running", { message: "Đang chạy lệnh cài đặt..." }),
    });

    try {
      const response = await requestJson("POST", baseUrl, `/api/setup/tasks/${task.id}/run`);
      const doneTask = summarizeSetupTask(task, "success", {
        message: response.message || "Hoàn tất.",
        output: response.output || "",
        command: response.command || task.command || "",
      });
      results.push(doneTask);
      sendSetupStatus({ kind: "task-update", task: doneTask });
    } catch (error) {
      const failedTask = summarizeSetupTask(task, "failed", {
        message: error instanceof Error ? error.message : String(error),
        command: task.command || "",
      });
      results.push(failedTask);
      sendSetupStatus({ kind: "task-update", task: failedTask });
    }
  }

  sendSetupStatus({
    kind: "section",
    step: "autostart",
    status: "running",
    message: "Đang tự khởi động các service đã cài sẵn...",
  });

  try {
    const autostart = await requestJson("POST", baseUrl, "/api/setup/autostart");
    const autostartItems = [
      ...(autostart.started || []).map((item) => ({ ...item, state: "success" })),
      ...(autostart.skipped || []).map((item) => ({ ...item, state: "skipped" })),
      ...(autostart.failed || []).map((item) => ({ ...item, state: "failed" })),
    ];
    for (const item of autostartItems) {
      sendSetupStatus({
        kind: "task-update",
        task: {
          id: `autostart-${item.id}`,
          label: `Autostart · ${item.label || item.id}`,
          state: item.state,
          detail: item.message || "",
        },
      });
    }
  } catch (error) {
    sendSetupStatus({
      kind: "task-update",
      task: {
        id: "autostart-error",
        label: "Autostart services",
        state: "failed",
        detail: error instanceof Error ? error.message : String(error),
      },
    });
  }

  const finalStatus = await requestJson("GET", baseUrl, "/api/setup/status");
  const failedCount = results.filter((task) => task.state === "failed").length;
  const successCount = results.filter((task) => task.state === "success").length;
  const skippedCount = results.filter((task) => task.state === "skipped").length;

  sendSetupStatus({
    kind: "summary",
    step: "health-setup",
    status: finalStatus.coreReady && failedCount === 0 ? "done" : "warning",
    message: finalStatus.coreReady
      ? `Cài đặt hoàn tất. Success: ${successCount}, Failed: ${failedCount}, Skipped: ${skippedCount}.`
      : `Cài đặt xong nhưng core runtime chưa pass. Success: ${successCount}, Failed: ${failedCount}, Skipped: ${skippedCount}.`,
    summary: {
      success: successCount,
      failed: failedCount,
      skipped: skippedCount,
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

  registerSetupIpcHandlers();
  const setup = createSetupWindow();

  try {
    sendSetupStatus({ kind: "step", step: "config", status: "running", message: "Vui lòng kiểm tra cấu hình cài đặt trước khi chạy setup." });
    await waitForSetupConfig();

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
