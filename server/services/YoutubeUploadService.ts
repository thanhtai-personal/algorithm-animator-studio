import fs from "node:fs";
import { google } from "googleapis";
import { CLIENT_ORIGIN } from "../config/paths";
import { readEnvValues, type RuntimeEnvValues } from "./EnvFileService";
import type { YoutubeUploadBody } from "../models/YoutubeUpload";

const YOUTUBE_UPLOAD_SCOPE = "https://www.googleapis.com/auth/youtube.upload";
const YOUTUBE_PLAYLIST_SCOPE = "https://www.googleapis.com/auth/youtube";

export function getYoutubeConfigStatus(envOverrides: RuntimeEnvValues = {}) {
  const env = readEnvValues(envOverrides);

  return {
    hasClientId: Boolean(env.YOUTUBE_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID),
    hasClientSecret: Boolean(env.YOUTUBE_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET),
    hasRefreshToken: false,
    redirectUri:
      env.YOUTUBE_REDIRECT_URI ||
      process.env.YOUTUBE_REDIRECT_URI ||
      `${CLIENT_ORIGIN}/youtube`,
    defaults: {
      title: env.YOUTUBE_TITLE || process.env.YOUTUBE_TITLE || "Video tạo từ Kata Studio",
      description: env.YOUTUBE_DESCRIPTION || process.env.YOUTUBE_DESCRIPTION || "",
      tags: env.YOUTUBE_TAGS || process.env.YOUTUBE_TAGS || "truyen audio,tts,kata studio",
      categoryId: env.YOUTUBE_CATEGORY_ID || process.env.YOUTUBE_CATEGORY_ID || "22",
      privacyStatus: env.YOUTUBE_PRIVACY_STATUS || process.env.YOUTUBE_PRIVACY_STATUS || "unlisted",
      madeForKids: readBooleanEnv("YOUTUBE_MADE_FOR_KIDS", false, env),
      notifySubscribers: readBooleanEnv("YOUTUBE_NOTIFY_SUBSCRIBERS", false, env),
      containsSyntheticMedia: readBooleanEnv("YOUTUBE_CONTAINS_SYNTHETIC_MEDIA", true, env),
    },
  };
}

export function createYoutubeAuthUrl(redirectUri: string, envOverrides: RuntimeEnvValues = {}): string {
  return createOAuthClient(redirectUri, envOverrides).generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    redirect_uri: redirectUri,
    scope: [YOUTUBE_UPLOAD_SCOPE, YOUTUBE_PLAYLIST_SCOPE],
  });
}

export async function exchangeYoutubeCode(
  code: string,
  redirectUri: string,
  envOverrides: RuntimeEnvValues = {}
) {
  const auth = createOAuthClient(redirectUri, envOverrides);
  const { tokens } = await auth.getToken(code);

  return {
    hasRefreshToken: Boolean(tokens.refresh_token),
    refreshToken: tokens.refresh_token || "",
    scope: tokens.scope,
    expiryDate: tokens.expiry_date,
  };
}

export async function listYoutubePlaylists(
  refreshToken: string | undefined,
  envOverrides: RuntimeEnvValues = {}
) {
  const youtube = createAuthorizedYoutubeClient(refreshToken, envOverrides);
  const playlists = [];
  let pageToken: string | undefined;

  do {
    const response = await youtube.playlists.list({
      part: ["snippet"],
      mine: true,
      maxResults: 50,
      pageToken,
    });

    playlists.push(
      ...(response.data.items || [])
        .map((playlist) => ({
          id: playlist.id || "",
          title: playlist.snippet?.title || "",
        }))
        .filter((playlist) => playlist.id && playlist.title)
    );
    pageToken = response.data.nextPageToken || undefined;
  } while (pageToken);

  return { playlists };
}

export async function uploadYoutubeVideo(params: {
  filePath: string;
  originalFileName: string;
  body: YoutubeUploadBody;
  envOverrides?: RuntimeEnvValues;
}) {
  const defaults = getYoutubeConfigStatus(params.envOverrides).defaults;
  const youtube = createAuthorizedYoutubeClient(params.body.refreshToken, params.envOverrides);
  const response = await youtube.videos.insert({
    part: ["snippet", "status"],
    notifySubscribers: readBooleanInput(params.body.notifySubscribers, defaults.notifySubscribers),
    requestBody: {
      snippet: {
        title: params.body.title || defaults.title || params.originalFileName,
        description: params.body.description || defaults.description,
        categoryId: params.body.categoryId || defaults.categoryId,
        tags: splitCsv(params.body.tags || defaults.tags),
      },
      status: {
        privacyStatus: params.body.privacyStatus || defaults.privacyStatus,
        selfDeclaredMadeForKids: readBooleanInput(params.body.madeForKids, defaults.madeForKids),
        publishAt: params.body.publishAt || undefined,
        containsSyntheticMedia: readBooleanInput(
          params.body.containsSyntheticMedia,
          defaults.containsSyntheticMedia
        ),
      },
    },
    media: {
      body: fs.createReadStream(params.filePath),
    },
  });

  const videoId = response.data.id;
  const playlistId = params.body.playlistId || "";
  let playlistWarning: string | undefined;

  if (videoId && playlistId) {
    try {
      await addVideoToPlaylist(youtube, playlistId, videoId);
    } catch (error) {
      playlistWarning =
        error instanceof Error
          ? error.message
          : "Video đã đăng nhưng chưa thêm được vào playlist.";
    }
  }

  return {
    ok: Boolean(videoId),
    id: videoId,
    url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : "",
    title: response.data.snippet?.title,
    privacyStatus: response.data.status?.privacyStatus,
    playlistId: playlistId || undefined,
    playlistWarning,
  };
}

async function addVideoToPlaylist(
  youtube: ReturnType<typeof createAuthorizedYoutubeClient>,
  playlistId: string,
  videoId: string
) {
  await youtube.playlistItems.insert({
    part: ["snippet"],
    requestBody: {
      snippet: {
        playlistId,
        resourceId: {
          kind: "youtube#video",
          videoId,
        },
      },
    },
  });
}

function createOAuthClient(
  redirectUriOverride?: string,
  envOverrides: RuntimeEnvValues = {}
) {
  const env = readEnvValues(envOverrides);
  const clientId = env.YOUTUBE_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = env.YOUTUBE_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET;
  const redirectUri =
    redirectUriOverride ||
    env.YOUTUBE_REDIRECT_URI ||
    process.env.YOUTUBE_REDIRECT_URI ||
    `${CLIENT_ORIGIN}/youtube`;

  if (!clientId || !clientSecret) {
    throw new Error("Chưa cấu hình quyền YouTube trên app-server.");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

function createAuthorizedYoutubeClient(
  refreshToken: string | undefined,
  envOverrides: RuntimeEnvValues = {}
) {
  const auth = createOAuthClient(undefined, envOverrides);

  if (!refreshToken) {
    throw new Error("Cần cấp quyền trên giao diện trước khi đăng.");
  }

  auth.setCredentials({
    refresh_token: refreshToken,
  });

  return google.youtube({
    version: "v3",
    auth,
  });
}

function splitCsv(value: string): string[] | undefined {
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length ? items : undefined;
}

function readBooleanEnv(
  name: string,
  fallback: boolean,
  envOverrides: RuntimeEnvValues = {}
): boolean {
  const env = readEnvValues(envOverrides);
  return readBooleanInput(env[name], fallback);
}

function readBooleanInput(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  return ["1", "true", "yes", "y"].includes(value.toLowerCase());
}
