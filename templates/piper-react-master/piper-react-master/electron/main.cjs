const { app, BrowserWindow, dialog, shell } = require("electron");
const fs = require("node:fs");
const http = require("node:http");
const net = require("node:net");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { ensureDesktopRuntime } = require("./runtime-bootstrap.cjs");

let mainWindow;
let setupWindow;
let clientServer;

const DEFAULT_CLIENT_PORT = 6868;
const DEFAULT_SERVER_PORT = 8888;

function getAppRoot() {
  return app.isPackaged ? path.join(process.resourcesPath, "app.asar") : path.resolve(__dirname, "..");
}


function getWindowIconPath() {
  const iconPath = path.join(getAppRoot(), "assets", "app-icon.png");
  return fs.existsSync(iconPath) ? iconPath : undefined;
}

function getDesktopClientDir() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "desktop-client")
    : path.join(getAppRoot(), "build", "client");
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
    throw new Error(`Không tìm thấy React desktop build tại ${indexHtml}. Hãy chạy npm run build:desktop trước khi mở Electron.`);
  }

  await waitUntilPortFree(DEFAULT_CLIENT_PORT, "Client");

  clientServer = http.createServer((req, res) => {
    const requestUrl = new URL(req.url || "/", `http://127.0.0.1:${DEFAULT_CLIENT_PORT}`);
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
    clientServer.listen(DEFAULT_CLIENT_PORT, "127.0.0.1", () => {
      clientServer?.off("error", reject);
      console.log(`[desktop] Client running at http://127.0.0.1:${DEFAULT_CLIENT_PORT}`);
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

function createSetupWindow() {
  setupWindow = new BrowserWindow({
    width: 560,
    height: 420,
    minWidth: 520,
    minHeight: 360,
    resizable: false,
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

async function startBackend(runtime) {
  const userData = app.getPath("userData");
  const serverDataDir = path.join(userData, "server-data");
  fs.mkdirSync(serverDataDir, { recursive: true });

  await waitUntilPortFree(DEFAULT_SERVER_PORT, "Backend");

  process.env.KATA_DESKTOP_RUNTIME = "true";
  process.env.KATA_STUDIO_HOME = runtime.runtimeHome;
  process.env.PORT = String(DEFAULT_SERVER_PORT);
  process.env.SERVER_ORIGIN = `http://127.0.0.1:${DEFAULT_SERVER_PORT}`;
  process.env.CLIENT_ORIGIN = `http://127.0.0.1:${DEFAULT_CLIENT_PORT}`;
  process.env.SERVER_DATA_DIR = process.env.SERVER_DATA_DIR || serverDataDir;
  process.env.MODEL_DIR = process.env.MODEL_DIR || runtime.modelDir;
  process.env.PIPER_EXE = process.env.PIPER_EXE || runtime.piperExe;

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

  mainWindow.loadURL(`http://127.0.0.1:${DEFAULT_CLIENT_PORT}`);
}

app.whenReady().then(async () => {
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
    sendSetupStatus({ step: "client", status: "running", message: "Đang khởi động client local ở port 6868..." });
    await startClientServer();
    sendSetupStatus({ step: "ready", status: "done", message: "Hoàn tất. Đang mở Kata Studio..." });

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
