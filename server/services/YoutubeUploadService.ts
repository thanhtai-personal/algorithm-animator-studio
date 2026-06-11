import fs from "node:fs";
import { google } from "googleapis";
import { CLIENT_ORIGIN } from "../config/paths";
import { readEnvValues, type RuntimeEnvValues } from "./EnvFileService";
import type { YoutubeUploadBody } from "../models/YoutubeUpload";

const YOUTUBE_UPLOAD_SCOPE = "https://www.googleapis.com/auth/youtube.upload";
const YOUTUBE_PLAYLIST_SCOPE = "https://www.googleapis.com/auth/youtube";

export function getYoutubeConfigStatus(envOverrides: RuntimeEnvValues = {}) {
  const env = readEnvValues(envOverrides);
  const clientId = env.YOUTUBE_CLIENT_ID;
  const clientSecret = env.YOUTUBE_CLIENT_SECRET;

  return {
    hasClientId: Boolean(clientId),
    hasClientSecret: Boolean(clientSecret),
    hasRefreshToken: false,
    clientIdHint: maskClientId(clientId),
    redirectUri:
      env.YOUTUBE_REDIRECT_URI ||
      `${CLIENT_ORIGIN}/channel`,
    defaults: {
      title: env.YOUTUBE_TITLE,
      description: env.YOUTUBE_DESCRIPTION,
      tags: env.YOUTUBE_TAGS,
      categoryId: env.YOUTUBE_CATEGORY_ID,
      privacyStatus: env.YOUTUBE_PRIVACY_STATUS,
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
  const { tokens } = await getOAuthTokens(auth, code, redirectUri);

  return {
    hasRefreshToken: Boolean(tokens.refresh_token),
    refreshToken: tokens.refresh_token || "",
    scope: tokens.scope,
    expiryDate: tokens.expiry_date,
  };
}


export async function getYoutubeChannelProfile(
  refreshToken: string | undefined,
  envOverrides: RuntimeEnvValues = {}
) {
  const youtube = createAuthorizedYoutubeClient(refreshToken, envOverrides);
  const response = await youtube.channels.list({
    part: ["snippet", "statistics", "contentDetails"],
    mine: true,
    maxResults: 1,
  });
  const channel = response.data.items?.[0];

  if (!channel) {
    throw new Error("Không tìm thấy kênh YouTube tương ứng với tài khoản đã cấp quyền.");
  }

  return {
    id: channel.id || "",
    title: channel.snippet?.title || "Untitled channel",
    description: channel.snippet?.description || "",
    customUrl: channel.snippet?.customUrl || undefined,
    thumbnailUrl: channel.snippet?.thumbnails?.high?.url || channel.snippet?.thumbnails?.default?.url,
    subscriberCount: channel.statistics?.subscriberCount,
    videoCount: channel.statistics?.videoCount,
    viewCount: channel.statistics?.viewCount,
    uploadsPlaylistId: channel.contentDetails?.relatedPlaylists?.uploads,
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

export async function listYoutubeChannelVideos(
  refreshToken: string | undefined,
  uploadsPlaylistId?: string,
  envOverrides: RuntimeEnvValues = {}
) {
  const youtube = createAuthorizedYoutubeClient(refreshToken, envOverrides);
  const playlistId = uploadsPlaylistId || (await getYoutubeChannelProfile(refreshToken, envOverrides)).uploadsPlaylistId;
  if (!playlistId) throw new Error("Không tìm thấy playlist uploads của kênh YouTube.");

  const videos = [];
  let pageToken: string | undefined;

  do {
    const response = await youtube.playlistItems.list({
      part: ["snippet", "contentDetails"],
      maxResults: 50,
      pageToken,
      playlistId,
    });

    videos.push(
      ...(response.data.items || [])
        .map((item) => {
          const videoId = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId || "";
          return {
            id: videoId,
            title: item.snippet?.title || "Untitled video",
            description: item.snippet?.description || "",
            publishedAt: item.contentDetails?.videoPublishedAt || item.snippet?.publishedAt || "",
            thumbnailUrl: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
            url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : "",
          };
        })
        .filter((video) => video.id)
    );
    pageToken = response.data.nextPageToken || undefined;
  } while (pageToken);

  return { videos };
}

export async function uploadYoutubeVideo(params: {
  filePath: string;
  originalFileName: string;
  body: YoutubeUploadBody;
  envOverrides?: RuntimeEnvValues;
}) {
  const defaults = getYoutubeConfigStatus(params.envOverrides).defaults;
  const youtube = createAuthorizedYoutubeClient(params.body.refreshToken, params.envOverrides);
  const publishAt = normalizePublishAt(params.body.publishAt);
  const privacyStatus = publishAt ? "private" : params.body.privacyStatus || defaults.privacyStatus;
  const response = await youtube.videos.insert({
    part: ["snippet", "status"],
    notifySubscribers: readBooleanInput(params.body.notifySubscribers, defaults.notifySubscribers),
    requestBody: {
      snippet: {
        title: params.body.title || defaults.title || params.originalFileName,
        description: appendMusicLicense(params.body.description || defaults.description, params.body.musicLicenseText),
        categoryId: params.body.categoryId || defaults.categoryId,
        tags: splitCsv(params.body.tags || defaults.tags),
      },
      status: {
        privacyStatus,
        selfDeclaredMadeForKids: readBooleanInput(params.body.madeForKids, defaults.madeForKids),
        publishAt,
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
  const clientId = env.YOUTUBE_CLIENT_ID;
  const clientSecret = env.YOUTUBE_CLIENT_SECRET;
  const redirectUri =
    redirectUriOverride ||
    env.YOUTUBE_REDIRECT_URI ||
    `${CLIENT_ORIGIN}/channel`;

  if (!clientId || !clientSecret) {
    throw new Error("Chưa cấu hình quyền YouTube trên app-server.");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

async function getOAuthTokens(
  auth: ReturnType<typeof createOAuthClient>,
  code: string,
  redirectUri: string
) {
  try {
    return await auth.getToken(code);
  } catch (error) {
    throw normalizeYoutubeOAuthError(error, redirectUri);
  }
}

function normalizeYoutubeOAuthError(error: unknown, redirectUri: string) {
  const googleError = readGoogleOAuthError(error);

  if (googleError.code === "invalid_client") {
    return new Error(
      [
        "Google OAuth trả invalid_client khi đổi authorization code lấy token.",
        "Kiểm tra YOUTUBE_CLIENT_ID và YOUTUBE_CLIENT_SECRET trên server: cả hai phải được copy từ cùng một OAuth Client ID loại Web application trong Google Cloud.",
        `Authorized redirect URI của OAuth client phải có chính xác: ${redirectUri}`,
        "Nếu vừa đổi env trên Vercel/server, cần redeploy hoặc restart server rồi login YouTube lại để lấy code mới.",
      ].join(" ")
    );
  }

  if (googleError.code === "redirect_uri_mismatch") {
    return new Error(
      `Google OAuth redirect URI mismatch. Hãy thêm chính xác redirect URI này vào OAuth Client trong Google Cloud: ${redirectUri}`
    );
  }

  const description = googleError.description || googleError.message;
  return new Error(description ? `Google OAuth thất bại: ${description}` : "Google OAuth thất bại khi đổi authorization code.");
}

function readGoogleOAuthError(error: unknown) {
  const candidate = error as {
    message?: string;
    response?: {
      data?: {
        error?: string;
        error_description?: string;
      };
    };
  };

  return {
    code: candidate.response?.data?.error,
    description: candidate.response?.data?.error_description,
    message: candidate.message,
  };
}

function maskClientId(clientId: string) {
  if (!clientId) return "";
  if (clientId.length <= 18) return "<configured>";
  return `${clientId.slice(0, 8)}...${clientId.slice(-16)}`;
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

function normalizePublishAt(value: string | undefined) {
  const raw = value?.trim();
  if (!raw) return undefined;
  const timestamp = Date.parse(raw);
  if (!Number.isFinite(timestamp)) throw new Error("Lịch đăng YouTube không hợp lệ.");
  if (timestamp <= Date.now() + 5 * 60 * 1000) throw new Error("Lịch đăng YouTube phải ở tương lai ít nhất 5 phút.");
  return new Date(timestamp).toISOString();
}

function appendMusicLicense(description: string, licenseText: string | undefined) {
  const license = licenseText?.trim();
  if (!license || description.includes(license)) return description;
  const separator = description.trim() ? "\n\n" : "";
  return `${description.trim()}${separator}Music license:\n${license}`;
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
