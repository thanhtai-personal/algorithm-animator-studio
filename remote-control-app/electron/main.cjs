const { app, BrowserWindow, Menu, Tray, dialog, ipcMain, nativeImage, shell } = require("electron");
const fs = require("node:fs");
const http = require("node:http");
const net = require("node:net");
const path = require("node:path");

const REMOTE_HOST = "127.0.0.1";
const REMOTE_PORT = 8891;
const REMOTE_ORIGIN = `http://${REMOTE_HOST}:${REMOTE_PORT}`;

let mainWindow;
let tray;
let isQuitting = false;

app.setName("KAI Remote");
app.setAppUserModelId("vn.kaistudio.remote");

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) app.quit();

function getAppRoot() {
  if (!app.isPackaged) return path.resolve(__dirname, "..");
  const asarRoot = path.join(process.resourcesPath, "app.asar");
  return fs.existsSync(asarRoot) ? asarRoot : path.join(process.resourcesPath, "app");
}

function getClientDirectory() {
  return app.isPackaged
    ? path.join(getAppRoot(), "remote-client")
    : path.join(getAppRoot(), "dist");
}

function getIconPath() {
  const candidates = [
    path.join(getAppRoot(), "public", "favicon.ico"),
    path.join(process.resourcesPath || "", "favicon.ico"),
  ];
  return candidates.find((candidate) => candidate && fs.existsSync(candidate)) || "";
}

function configureRemoteEnvironment() {
  const clientDirectory = getClientDirectory();
  const indexHtml = path.join(clientDirectory, "index.html");
  if (!fs.existsSync(indexHtml)) {
    throw new Error(`Không tìm thấy KAI Remote renderer tại ${indexHtml}. Hãy chạy npm run build:remote.`);
  }

  if (!process.env.KATA_STUDIO_HOME && process.platform === "win32" && process.env.LOCALAPPDATA) {
    process.env.KATA_STUDIO_HOME = path.join(process.env.LOCALAPPDATA, "KAI STUDIO");
  }
  process.env.KATA_DESKTOP_RUNTIME = "true";
  process.env.PORT = String(REMOTE_PORT);
  process.env.SERVER_ORIGIN = REMOTE_ORIGIN;
  process.env.CLIENT_ORIGIN = REMOTE_ORIGIN;
  process.env.KATA_REMOTE_CLIENT_DIR = clientDirectory;
}

function isPortFree() {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.once("error", () => resolve(false));
    probe.once("listening", () => probe.close(() => resolve(true)));
    probe.listen(REMOTE_PORT, REMOTE_HOST);
  });
}

function requestHealth(timeoutMs = 1500) {
  return new Promise((resolve) => {
    const request = http.get(`${REMOTE_ORIGIN}/api/health`, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { body += chunk; });
      response.on("end", () => {
        try {
          const payload = JSON.parse(body);
          resolve(response.statusCode === 200 && payload.service === "kai-remote");
        } catch {
          resolve(false);
        }
      });
    });
    request.once("error", () => resolve(false));
    request.setTimeout(timeoutMs, () => {
      request.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(timeoutMs = 10_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await requestHealth()) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error("KAI Remote backend không phản hồi sau 10 giây.");
}

async function startRemoteServer() {
  if (!(await isPortFree())) {
    if (await requestHealth()) return;
    throw new Error(`Port ${REMOTE_PORT} đang được một ứng dụng khác sử dụng.`);
  }

  const serverEntry = path.join(getAppRoot(), "dist-server", "index.cjs");
  if (!fs.existsSync(serverEntry)) {
    throw new Error(`Không tìm thấy backend KAI Remote tại ${serverEntry}.`);
  }
  require(serverEntry);
  await waitForServer();
}

function getPreferences() {
  const startupSupported = process.platform === "win32" && app.isPackaged;
  const loginSettings = startupSupported ? app.getLoginItemSettings() : { openAtLogin: false };
  return {
    launchAtLogin: Boolean(loginSettings.openAtLogin),
    packaged: app.isPackaged,
    platform: process.platform,
    startupSupported,
  };
}

function setLaunchAtLogin(enabled) {
  if (process.platform !== "win32" || !app.isPackaged) {
    throw new Error("Khởi động cùng Windows chỉ khả dụng trong ứng dụng KAI Remote đã đóng gói.");
  }
  app.setLoginItemSettings({
    openAtLogin: Boolean(enabled),
    path: process.execPath,
    args: enabled ? ["--hidden"] : [],
  });
  rebuildTrayMenu();
  return getPreferences();
}

function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createMainWindow(true);
    return;
  }
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function createMainWindow(shouldShow) {
  mainWindow = new BrowserWindow({
    width: 980,
    height: 860,
    minWidth: 720,
    minHeight: 620,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#070f1c",
    icon: getIconPath(),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.on("close", (event) => {
    if (isQuitting) return;
    event.preventDefault();
    mainWindow.hide();
  });
  mainWindow.on("closed", () => { mainWindow = undefined; });
  mainWindow.once("ready-to-show", () => {
    if (shouldShow) mainWindow?.show();
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });
  void mainWindow.loadURL(REMOTE_ORIGIN);
}

function rebuildTrayMenu() {
  if (!tray) return;
  const preferences = getPreferences();
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: "Mở KAI Remote", click: showMainWindow },
    { type: "separator" },
    {
      label: "Khởi động cùng Windows",
      type: "checkbox",
      checked: preferences.launchAtLogin,
      enabled: preferences.startupSupported,
      click: (item) => setLaunchAtLogin(item.checked),
    },
    { type: "separator" },
    {
      label: "Thoát",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]));
}

function createTray() {
  const icon = nativeImage.createFromPath(getIconPath());
  tray = new Tray(icon);
  tray.setToolTip("KAI Remote · Telegram Remote Control");
  tray.on("click", showMainWindow);
  rebuildTrayMenu();
}

ipcMain.handle("kai-remote:get-preferences", () => getPreferences());
ipcMain.handle("kai-remote:set-launch-at-login", (_event, enabled) => setLaunchAtLogin(enabled));

app.on("second-instance", showMainWindow);
app.whenReady().then(async () => {
  try {
    configureRemoteEnvironment();
    await startRemoteServer();
    createTray();
    createMainWindow(!process.argv.includes("--hidden"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    dialog.showErrorBox("Không thể khởi động KAI Remote", message);
    isQuitting = true;
    app.quit();
  }
});

app.on("activate", showMainWindow);
app.on("before-quit", () => {
  isQuitting = true;
  tray?.destroy();
  tray = undefined;
});
app.on("window-all-closed", () => {
  // KAI Remote tiếp tục chạy trong system tray.
});
