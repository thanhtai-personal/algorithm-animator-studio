import cors from "cors";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import {
  GENERATED_DIR,
  GENERATED_PREVIEW_DIR,
  GENERATED_VIDEO_DIR,
  GENERATED_PUBLIC_PATH,
  GENERATED_PREVIEW_PUBLIC_PATH,
  GENERATED_VIDEO_PUBLIC_PATH,
  GENERATED_BACKGROUND_MUSIC_DIR,
  GENERATED_BACKGROUND_MUSIC_PUBLIC_PATH,
  MODEL_DIR,
  PIPER_EXE,
  PORT,
  getGeneratedDir,
  getGeneratedPreviewDir,
  getGeneratedVideoDir,
  getGeneratedBackgroundMusicDir,
} from "./config/paths";
import { createAiShortsRouter } from "./routes/aiShortsRoutes";
import { createElevenLabsRouter } from "./routes/elevenLabsRoutes";
import { createGenerateRouter } from "./routes/generateRoutes";
import { createHealthRouter } from "./routes/healthRoutes";
import { createModelRouter } from "./routes/modelRoutes";
import { createResourceRouter } from "./routes/resourceRoutes";
import { createSystemRouter } from "./routes/systemRoutes";
import { createVideoRouter } from "./routes/videoRoutes";
import { createYoutubeRouter } from "./routes/youtubeRoutes";
import { createWebExtractRouter } from "./routes/webExtractRoutes";
import { readRuntimeEnvFromRequest } from "./services/RuntimeEnvService";
import { readEnvValues } from "./services/EnvFileService";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

if (!fs.existsSync(GENERATED_DIR)) {
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
}

if (!fs.existsSync(GENERATED_PREVIEW_DIR)) {
  fs.mkdirSync(GENERATED_PREVIEW_DIR, { recursive: true });
}

if (!fs.existsSync(GENERATED_VIDEO_DIR)) {
  fs.mkdirSync(GENERATED_VIDEO_DIR, { recursive: true });
}

if (!fs.existsSync(GENERATED_BACKGROUND_MUSIC_DIR)) {
  fs.mkdirSync(GENERATED_BACKGROUND_MUSIC_DIR, { recursive: true });
}

app.use(`/${GENERATED_PUBLIC_PATH}`, createDynamicStaticMiddleware(getGeneratedDir));
app.use(`/${GENERATED_PREVIEW_PUBLIC_PATH}`, createDynamicStaticMiddleware(getGeneratedPreviewDir));
app.use(`/${GENERATED_VIDEO_PUBLIC_PATH}`, createDynamicStaticMiddleware(getGeneratedVideoDir));
app.use(`/${GENERATED_BACKGROUND_MUSIC_PUBLIC_PATH}`, createDynamicStaticMiddleware(getGeneratedBackgroundMusicDir));
app.use(
  "/api",
  createHealthRouter(),
  createModelRouter(),
  createResourceRouter(),
  createSystemRouter(),
  createGenerateRouter(),
  createElevenLabsRouter(),
  createVideoRouter(),
  createYoutubeRouter(),
  createWebExtractRouter(),
  createAiShortsRouter()
);

// Electron bản đóng gói chạy client riêng ở http://127.0.0.1:6868.
// Backend chỉ giữ nhiệm vụ API ở http://127.0.0.1:8888, không serve React build nữa.


app.listen(PORT, () => {
  console.log(`Local voice backend running at http://localhost:${PORT}`);
  console.log(`Local voice exe: ${PIPER_EXE}`);
  console.log(`Model dir: ${MODEL_DIR}`);
  console.log(`Generated dir: ${GENERATED_DIR}`);
  console.log(`Generated video dir: ${GENERATED_VIDEO_DIR}`);
  console.log(`Background music dir: ${GENERATED_BACKGROUND_MUSIC_DIR}`);
});

function mountDesktopClient() {
  if (process.env.KATA_DESKTOP_RUNTIME !== "true") return;

  const desktopClientDir = process.env.DESKTOP_CLIENT_DIR
    ? path.resolve(process.env.DESKTOP_CLIENT_DIR)
    : path.resolve(process.cwd(), "build", "client");
  const indexHtml = path.join(desktopClientDir, "index.html");

  if (!fs.existsSync(indexHtml)) {
    console.warn(`[desktop] Không tìm thấy React build tại ${indexHtml}`);
    return;
  }

  console.log(`[desktop] Serving React client from ${desktopClientDir}`);

  app.use(
    express.static(desktopClientDir, {
      index: false,
      fallthrough: true,
      setHeaders(res, filePath) {
        if (/\.(?:js|mjs|css|map|png|jpg|jpeg|webp|svg|ico|webmanifest)$/i.test(filePath)) {
          res.setHeader("Cache-Control", "no-store");
        }
      },
    })
  );

  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (req.path.startsWith("/api")) return next();
    if (req.path.startsWith(`/${GENERATED_PUBLIC_PATH}`)) return next();
    if (req.path.startsWith(`/${GENERATED_PREVIEW_PUBLIC_PATH}`)) return next();
    if (req.path.startsWith(`/${GENERATED_VIDEO_PUBLIC_PATH}`)) return next();
    if (req.path.startsWith(`/${GENERATED_BACKGROUND_MUSIC_PUBLIC_PATH}`)) return next();

    // Không fallback index.html cho asset/static request.
    // Nếu /assets/*.js bị fallback thành HTML, trình duyệt báo MIME text/html và React Router reload liên tục.
    if (isDesktopAssetRequest(req.path)) {
      console.warn(`[desktop] Missing static asset: ${req.path}`);
      return res.status(404).type("text/plain").send(`Static asset not found: ${req.path}`);
    }

    return res.sendFile(indexHtml);
  });
}

function isDesktopAssetRequest(requestPath: string) {
  if (requestPath.startsWith("/assets/")) return true;
  if (requestPath === "/favicon.ico") return true;
  if (requestPath === "/manifest.webmanifest") return true;
  if (requestPath === "/registerSW.js") return true;
  if (requestPath === "/sw.js") return true;
  if (requestPath.startsWith("/workbox-")) return true;
  return /\.(?:js|mjs|css|map|json|png|jpg|jpeg|webp|gif|svg|ico|txt|webmanifest|wasm)$/i.test(requestPath);
}


function createDynamicStaticMiddleware(resolveDirectory: (serverDataDir?: string) => string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const env = readEnvValues(readRuntimeEnvFromRequest(req));
    const rootPath = path.resolve(resolveDirectory(env.SERVER_DATA_DIR));
    const requestedRelativePath = decodeURIComponent(req.path.replace(/^\/+/, ""));
    const absolutePath = path.resolve(rootPath, requestedRelativePath);

    if (!absolutePath.startsWith(`${rootPath}${path.sep}`)) {
      return res.status(400).json({ error: "Đường dẫn tệp không hợp lệ." });
    }

    if (!fs.existsSync(absolutePath)) {
      return next();
    }

    return res.sendFile(absolutePath);
  };
}
