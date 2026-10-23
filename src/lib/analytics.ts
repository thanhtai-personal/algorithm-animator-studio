const DEFAULT_GA_MEASUREMENT_ID = "G-QRMY60H8GC";
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || DEFAULT_GA_MEASUREMENT_ID;
const GA_CLIENT_ID_KEY = "algo_studio_ga_client_id";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __GA_MEASUREMENT_ID__?: string;
  }
}

let initialized = false;

function getClientId() {
  const existing = window.localStorage.getItem(GA_CLIENT_ID_KEY);
  if (existing) return existing;

  const id = window.crypto?.randomUUID?.() ?? `${Date.now()}.${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(GA_CLIENT_ID_KEY, id);
  return id;
}

export function initAnalytics() {
  if (!GA_MEASUREMENT_ID || initialized || typeof window === "undefined") return;

  window.__GA_MEASUREMENT_ID__ = GA_MEASUREMENT_ID;
  window.dataLayer = window.dataLayer ?? [];
  window.gtag =
    window.gtag ??
    ((...args: unknown[]) => {
      window.dataLayer?.push(args);
    });

  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID, { send_page_view: false });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  initialized = true;
}

export function trackPageView(path: string) {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined") return;

  const pageLocation = `${window.location.origin}${path}`;
  const pageTitle = document.title;

  initAnalytics();
  window.gtag?.("config", GA_MEASUREMENT_ID, {
    page_path: path,
    page_location: pageLocation,
    page_title: pageTitle,
    send_page_view: true,
    transport_type: "beacon",
  });
  window.gtag?.("event", "page_view", {
    send_to: GA_MEASUREMENT_ID,
    page_path: path,
    page_location: pageLocation,
    page_title: pageTitle,
    transport_type: "beacon",
  });

  const payload = JSON.stringify({
    clientId: getClientId(),
    path,
    pageLocation,
    pageTitle,
  });

  if (!navigator.sendBeacon?.("/api/ga-pageview", new Blob([payload], { type: "application/json" }))) {
    void fetch("/api/ga-pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    });
  }
}
