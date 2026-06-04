export type OAuthPopupProvider = "youtube" | "facebook" | "tiktok" | "instagram";

export type OAuthPopupStatus = "success" | "error" | "closed" | "blocked";

export type OAuthPopupMessage = {
  type: "kai-studio.oauth-result";
  provider: OAuthPopupProvider;
  status: Exclude<OAuthPopupStatus, "closed" | "blocked">;
  message?: string;
  channelTitle?: string;
};

export type OAuthPopupResult =
  | OAuthPopupMessage
  | { provider: OAuthPopupProvider; status: "closed" | "blocked"; message?: string };

const POPUP_WIDTH = 720;
const POPUP_HEIGHT = 820;

export function openOAuthPopup(authUrl: string, provider: OAuthPopupProvider): Promise<OAuthPopupResult> {
  const top = Math.max(0, window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2);
  const left = Math.max(0, window.screenX + (window.outerWidth - POPUP_WIDTH) / 2);
  const popup = window.open(
    authUrl,
    `kai-studio-${provider}-oauth`,
    [
      "popup=yes",
      `width=${POPUP_WIDTH}`,
      `height=${POPUP_HEIGHT}`,
      `top=${Math.round(top)}`,
      `left=${Math.round(left)}`,
      "resizable=yes",
      "scrollbars=yes",
    ].join(",")
  );

  if (!popup) {
    return Promise.resolve({ provider, status: "blocked", message: "OAuth popup was blocked by the browser." });
  }

  popup.focus();

  return new Promise((resolve) => {
    let settled = false;

    const settle = (result: OAuthPopupResult) => {
      if (settled) return;
      settled = true;
      window.clearInterval(watchClosed);
      window.removeEventListener("message", handleMessage);
      resolve(result);
    };

    const watchClosed = window.setInterval(() => {
      if (popup.closed) {
        settle({ provider, status: "closed", message: "OAuth popup was closed before completing." });
      }
    }, 500);

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as Partial<OAuthPopupMessage> | null;
      if (!data || data.type !== "kai-studio.oauth-result" || data.provider !== provider) return;
      if (data.status !== "success" && data.status !== "error") return;
      settle(data as OAuthPopupMessage);
    };

    window.addEventListener("message", handleMessage);
  });
}

export function notifyOAuthOpener(message: Omit<OAuthPopupMessage, "type">) {
  if (!window.opener || window.opener.closed) return false;
  window.opener.postMessage({ ...message, type: "kai-studio.oauth-result" } satisfies OAuthPopupMessage, window.location.origin);
  return true;
}

export function isOAuthPopupWindow() {
  return Boolean(window.opener && !window.opener.closed);
}
