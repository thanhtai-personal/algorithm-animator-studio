const PKCE_STORAGE_PREFIX = "kai-studio.oauth.pkce.";

export async function createPkcePair() {
  const codeVerifier = base64UrlFromBytes(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
  return {
    codeVerifier,
    codeChallenge: base64UrlFromBytes(new Uint8Array(digest)),
  };
}

export function savePkceVerifier(state: string, codeVerifier: string) {
  localStorage.setItem(`${PKCE_STORAGE_PREFIX}${state}`, codeVerifier);
}

export function takePkceVerifier(state: string) {
  const key = `${PKCE_STORAGE_PREFIX}${state}`;
  const value = localStorage.getItem(key) || "";
  localStorage.removeItem(key);
  return value;
}

function base64UrlFromBytes(bytes: Uint8Array) {
  let value = "";
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
