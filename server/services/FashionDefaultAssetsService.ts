import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  GENERATED_VIDEO_PUBLIC_PATH, SERVER_ORIGIN, buildGeneratedFileUrl, getGeneratedVideoDir,
} from "../config/paths";
import { ensureDirectoryExists } from "../utils/audioOutput";
import { runFfmpeg } from "../utils/ffmpeg";
import { readEnvValues, type RuntimeEnvValues } from "./EnvFileService";

/**
 * Remote images are downloaded ONLY from the fixed, reviewed sources below.
 * They are stored as normalized PNGs in the user's SERVER_DATA_DIR and reused
 * offline on subsequent opens. No arbitrary user-provided URLs are fetched.
 */
const FASHION_DEFAULTS = [
  {
    id: "fashion-default-1",
    remote: "https://upload.wikimedia.org/wikipedia/commons/f/f1/Female_Model_Posing.jpg",
    cutWhite: true,
  },
  {
    id: "fashion-default-2",
    remote: "https://upload.wikimedia.org/wikipedia/commons/c/c2/Fashion_model_portrait.jpg",
    cutWhite: true,
  },
  {
    id: "fashion-default-3",
    remote: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Fashion_runway1.jpg",
    cutWhite: false,
  },
  {
    id: "fashion-default-fan",
    remote: "https://openclipart.org/image/800px/5174",
    cutWhite: false,
  },
] as const;

const DOWNLOAD_MAX_BYTES = 9 * 1024 * 1024;
const ALLOWED_HOSTS = new Set(["commons.wikimedia.org", "upload.wikimedia.org", "openclipart.org"]);
const inflight = new Map<string, Promise<void>>();

export async function prepareFashionDefaultAssets(envOverrides: RuntimeEnvValues = {}, includeModels = true) {
  const env = readEnvValues(envOverrides);
  const relativeDir = "preset-clips/fashion-claw/defaults";
  const root = path.join(getGeneratedVideoDir(env.SERVER_DATA_DIR), ...relativeDir.split("/"));
  ensureDirectoryExists(root);
  const items = FASHION_DEFAULTS.filter((item) => includeModels || item.id === "fashion-default-fan");

  const outputs = await Promise.all(items.map(async (item) => {
    const fileName = item.id + ".png";
    const outputPath = path.join(root, fileName);
    if (!fs.existsSync(outputPath)) {
      try {
        await ensureImageCached(item.remote, outputPath, item.cutWhite, envOverrides);
      } catch (error) {
        // A remote outage must not prevent rendering the vector fallback.
        console.warn("Fashion default image unavailable:", item.id, error instanceof Error ? error.message : error);
      }
    }
    if (!fs.existsSync(outputPath)) return null;
    return [item.id, buildGeneratedFileUrl(
      GENERATED_VIDEO_PUBLIC_PATH,
      path.posix.join(relativeDir, fileName),
      env.SERVER_ORIGIN || SERVER_ORIGIN,
    )] as const;
  }));

  return Object.fromEntries(outputs.filter((item): item is NonNullable<typeof item> => item !== null));
}

async function ensureImageCached(url: string, outputPath: string, cutWhite: boolean, envOverrides: RuntimeEnvValues) {
  if (inflight.has(outputPath)) return inflight.get(outputPath);
  const operation = (async () => {
    if (fs.existsSync(outputPath)) return;
    const token = randomUUID();
    const tempRaw = outputPath + "." + token + ".source";
    const tempPng = outputPath + "." + token + ".png";
    try {
      const buffer = await fetchPinnedImage(url);
      fs.writeFileSync(tempRaw, buffer);
      const effect = cutWhite
        ? "scale=w='min(900,iw)':h='min(1400,ih)':force_original_aspect_ratio=decrease,format=rgba,colorkey=0xffffff:0.12:0.06,format=rgba"
        : "scale=w='min(900,iw)':h='min(1400,ih)':force_original_aspect_ratio=decrease,format=rgba";
      await runFfmpeg(["-y", "-i", tempRaw, "-frames:v", "1", "-vf", effect, "-update", "1", tempPng], envOverrides);
      if (!fs.existsSync(outputPath)) fs.renameSync(tempPng, outputPath);
    } finally {
      fs.rmSync(tempRaw, { force: true });
      fs.rmSync(tempPng, { force: true });
    }
  })();
  inflight.set(outputPath, operation);
  try { await operation; } finally { inflight.delete(outputPath); }
}

async function fetchPinnedImage(firstUrl: string) {
  let current = new URL(firstUrl);
  for (let redirect = 0; redirect < 4; redirect += 1) {
    if (current.protocol !== "https:" || !ALLOWED_HOSTS.has(current.hostname)) {
      throw new Error("Nguồn ảnh không nằm trong danh sách miền đáng tin cậy.");
    }
    const response = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(18000),
      headers: { "User-Agent": "KAI-STUDIO-fashion-demo/1.0 (Wikimedia Commons and Openclipart reusable art)" },
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const next = response.headers.get("location");
      if (!next) throw new Error("Ảnh trả về chuyển hướng không hợp lệ.");
      current = new URL(next, current);
      continue;
    }
    if (!response.ok) throw new Error("Không tải được ảnh mẫu (HTTP " + response.status + ")");
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) throw new Error("Nguồn ảnh không phải file hình.");
    const declaredLength = Number(response.headers.get("content-length") || 0);
    if (declaredLength > DOWNLOAD_MAX_BYTES) throw new Error("Ảnh mẫu vượt quá giới hạn kích thước.");
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Không đọc được dữ liệu ảnh.");
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > DOWNLOAD_MAX_BYTES) {
        await reader.cancel();
        throw new Error("Dữ liệu ảnh vượt quá giới hạn kích thước.");
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
  }
  throw new Error("Ảnh mẫu chuyển hướng quá nhiều lần.");
}
