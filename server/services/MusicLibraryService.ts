import fs from "node:fs";
import path from "node:path";
import { SERVER_ORIGIN } from "../config/paths";
import { readEnvValues, type RuntimeEnvValues } from "./EnvFileService";

const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac"]);

export type MusicLibraryTrack = {
  id: string;
  title: string;
  folderName: string;
  fileName: string;
  audioUrl: string;
  licenseText?: string;
};

export function listMusicLibraryTracks(envOverrides: RuntimeEnvValues = {}): MusicLibraryTrack[] {
  const root = resolveMusicLibraryRoot(envOverrides);
  if (!root || !fs.existsSync(root)) return [];

  return fs.readdirSync(root, { withFileTypes: true })
    .flatMap((entry) => {
      if (entry.isDirectory()) return readTrackFolder(root, entry.name);
      if (entry.isFile() && AUDIO_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) return readTrackFile(root, entry.name);
      return [];
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function resolveMusicLibraryAudioPath(trackId: string, envOverrides: RuntimeEnvValues = {}) {
  const root = resolveMusicLibraryRoot(envOverrides);
  if (!root) throw new Error("Chưa cấu hình MUSIC_LIBRARY_DIR.");
  const decoded = decodeTrackId(trackId);
  if (decoded.startsWith("file:")) {
    const fileName = decoded.slice("file:".length);
    const filePath = assertInsideRoot(root, path.join(root, fileName));
    if (!fs.existsSync(filePath) || !AUDIO_EXTENSIONS.has(path.extname(filePath).toLowerCase())) {
      throw new Error("Không tìm thấy file audio trong thư viện nhạc.");
    }
    return filePath;
  }
  const folderName = decoded.startsWith("dir:") ? decoded.slice("dir:".length) : decoded;
  const folderPath = assertInsideRoot(root, path.join(root, folderName));
  const fileName = findAudioFile(folderPath);
  if (!fileName) throw new Error("Không tìm thấy file audio trong folder nhạc.");
  return assertInsideRoot(root, path.join(folderPath, fileName));
}

function readTrackFolder(root: string, folderName: string): MusicLibraryTrack[] {
  const folderPath = assertInsideRoot(root, path.join(root, folderName));
  const fileName = findAudioFile(folderPath);
  if (!fileName) return [];
  const licenseText = readLicenseText(folderPath);
  const title = titleFromFileName(fileName) || folderName;
  return [{
    id: encodeTrackId(folderName),
    title,
    folderName,
    fileName,
    audioUrl: `${SERVER_ORIGIN}/api/music-library/${encodeURIComponent(encodeTrackId(folderName))}/audio`,
    licenseText,
  }];
}

function readTrackFile(root: string, fileName: string): MusicLibraryTrack[] {
  const filePath = assertInsideRoot(root, path.join(root, fileName));
  if (!fs.existsSync(filePath)) return [];
  const title = titleFromFileName(fileName);
  return [{
    id: encodeTrackId(`file:${fileName}`),
    title,
    folderName: "",
    fileName,
    audioUrl: `${SERVER_ORIGIN}/api/music-library/${encodeURIComponent(encodeTrackId(`file:${fileName}`))}/audio`,
  }];
}

function resolveMusicLibraryRoot(envOverrides: RuntimeEnvValues = {}) {
  const env = readEnvValues(envOverrides);
  const configured = env.MUSIC_LIBRARY_DIR?.trim() || process.env.MUSIC_LIBRARY_DIR?.trim();
  return configured ? path.resolve(configured) : "";
}

function findAudioFile(folderPath: string) {
  return fs.readdirSync(folderPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && AUDIO_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b))[0];
}

function readLicenseText(folderPath: string) {
  const licensePath = path.join(folderPath, "License.txt");
  if (!fs.existsSync(licensePath)) return undefined;
  return fs.readFileSync(licensePath, "utf8").trim() || undefined;
}

function titleFromFileName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
}

function encodeTrackId(folderName: string) {
  return Buffer.from(folderName, "utf8").toString("base64url");
}

function decodeTrackId(trackId: string) {
  return Buffer.from(trackId, "base64url").toString("utf8");
}

function assertInsideRoot(root: string, targetPath: string) {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(targetPath);
  if (resolvedTarget !== resolvedRoot && !resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error("Đường dẫn nhạc không hợp lệ.");
  }
  return resolvedTarget;
}
