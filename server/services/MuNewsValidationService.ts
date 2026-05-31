import type { MuNewsItem, MuNewsValidateItemResponse } from "../models/MuNews";

const LINK_CHECK_TIMEOUT_MS = 7_000;
const DETAIL_FETCH_TIMEOUT_MS = 12_000;
const DETAIL_HTML_LIMIT = 2_000_000;
const MIN_ARTICLE_CONTENT_LENGTH = 280;

export type NewsDateWindow = {
  fromMs: number;
  toMs: number;
};

export type PublishedDateInfo = {
  publishedAt: string;
  source: string;
};

export function createMuNewsDateWindow(): NewsDateWindow {
  return {
    fromMs: startOfYesterdayMs(),
    toMs: Date.now(),
  };
}

export function isPublishedInWindow(publishedAt: string, window: NewsDateWindow) {
  const value = Date.parse(publishedAt);
  return Number.isFinite(value) && value >= window.fromMs && value <= window.toMs;
}

export async function validateNewsItemLink(item: MuNewsItem) {
  if (!item.link) return false;
  if (isGoogleNewsUrl(item.link)) return true;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LINK_CHECK_TIMEOUT_MS);

  try {
    const response = await fetch(item.link, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; KATAMuNewsBot/1.0)",
        Accept: "text/html,application/xhtml+xml,text/plain,*/*;q=0.8",
      },
    });

    if (response.status === 405) return validateNewsItemLinkWithGet(item.link);
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function validateMuNewsItemDetail(item?: MuNewsItem): Promise<MuNewsValidateItemResponse> {
  if (!item?.id || !item.link) {
    return buildValidationResponse(item, false, "Tin thiếu URL hoặc ID, đã bỏ chọn.");
  }

  const window = createMuNewsDateWindow();
  if (!isPublishedInWindow(item.publishedAt, window)) {
    return buildValidationResponse(item, false, "Thời gian RSS không nằm trong khoảng từ hôm qua đến hiện tại.");
  }

  const linkOk = await validateNewsItemLink(item);
  if (!linkOk) return buildValidationResponse(item, false, "Không mở được URL bài viết.");

  const article = await fetchArticleHtml(item.link);
  if (!article.html) return buildValidationResponse(item, false, "Không tải được nội dung HTML của bài viết.");

  const articleContent = extractArticleContent(article.html);
  if (articleContent.length < MIN_ARTICLE_CONTENT_LENGTH) {
    return buildValidationResponse(item, false, "Không trích được nội dung bài viết đủ dài để tạo kịch bản.", undefined, undefined, article.url);
  }

  const detailPublishedDate = extractPublishedDateInfo(article.html);
  if (!detailPublishedDate.publishedAt) return buildValidationResponse(item, false, "Không tìm thấy thời gian publish trong bài viết.", undefined, undefined, article.url);

  if (!isPublishedInWindow(detailPublishedDate.publishedAt, window)) {
    return buildValidationResponse(
      item,
      false,
      "Thời gian publish trong bài viết không nằm trong khoảng từ hôm qua đến hiện tại.",
      detailPublishedDate.publishedAt,
      detailPublishedDate.source,
      article.url
    );
  }

  return buildValidationResponse(
    item,
    true,
    "Đã tải được nội dung bài viết và thời gian publish hợp lệ.",
    detailPublishedDate.publishedAt,
    detailPublishedDate.source,
    article.url,
    articleContent
  );
}

async function validateNewsItemLinkWithGet(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LINK_CHECK_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; KATAMuNewsBot/1.0)",
        Accept: "text/html,application/xhtml+xml,text/plain,*/*;q=0.8",
        Range: "bytes=0-1023",
      },
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function startOfYesterdayMs() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

async function fetchArticleHtml(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DETAIL_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 KATAMuNewsBot/1.0",
        Accept: "text/html,application/xhtml+xml,text/plain,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,vi;q=0.8",
      },
    });
    if (!response.ok) return { html: "", url: response.url || url };
    const contentType = response.headers.get("content-type") || "";
    if (contentType && !/html|text|xml|json/i.test(contentType)) return { html: "", url: response.url || url };
    const text = await response.text();
    return { html: text.slice(0, DETAIL_HTML_LIMIT), url: response.url || url };
  } catch {
    return { html: "", url };
  } finally {
    clearTimeout(timeout);
  }
}

export function extractPublishedDate(html: string) {
  return extractPublishedDateInfo(html).publishedAt;
}

export function extractPublishedDateInfo(html: string): PublishedDateInfo {
  const candidates: PublishedDateInfo[] = [
    ...extractMetaPublishedDates(html),
    ...extractTimeElementDates(html),
    ...extractJsonLdPublishedDates(html),
    ...extractInlineJsonPublishedDates(html),
    ...extractVisiblePublishedDates(html),
  ];

  return candidates.find((item) => item.publishedAt) || { publishedAt: "", source: "" };
}

function extractMetaPublishedDates(html: string) {
  const publishedNames = [
    "article:published_time",
    "og:published_time",
    "pubdate",
    "publishdate",
    "date",
    "datePublished",
    "parsely-pub-date",
    "sailthru.date",
  ].join("|");
  const modifiedNames = ["article:modified_time", "dateModified"].join("|");
  return [
    ...collectMetaDateMatches(html, publishedNames, "meta published"),
    ...collectMetaDateMatches(html, modifiedNames, "meta modified"),
  ];
}

function collectMetaDateMatches(html: string, names: string, source: string) {
  return [
    ...collectDateMatches(html, new RegExp(`<meta[^>]+(?:property|name|itemprop)=["'](?:${names})["'][^>]+content=["']([^"']+)["']`, "gi"), source),
    ...collectDateMatches(html, new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name|itemprop)=["'](?:${names})["']`, "gi"), source),
  ];
}

function extractTimeElementDates(html: string) {
  return collectDateMatches(html, /<time[^>]+datetime=["']([^"']+)["']/gi, "time[datetime]");
}

function extractJsonLdPublishedDates(html: string) {
  const scripts = Array.from(html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi));
  return scripts.flatMap((match) => readJsonDateValues(match[1], "JSON-LD"));
}

function extractInlineJsonPublishedDates(html: string) {
  return [
    ...collectDateMatches(html, /"(?:datePublished|dateCreated|dateModified|uploadDate)"\s*:\s*"([^"]+)"/gi, "inline JSON"),
    ...collectDateMatches(html, /'(?:datePublished|dateCreated|dateModified|uploadDate)'\s*:\s*'([^']+)'/gi, "inline JSON"),
  ];
}

function extractVisiblePublishedDates(html: string) {
  const text = normalizeText(stripTags(decodeHtmlEntities(html))).slice(0, 20_000);
  const labels = "(?:published|posted|updated|last updated|date published|ngày đăng|đăng lúc|cập nhật)";
  return collectDateMatches(
    text,
    new RegExp(`${labels}\\s*:?\\s*([A-Z][a-z]+\\s+\\d{1,2},\\s+\\d{4}(?:\\s+\\d{1,2}:\\d{2}\\s*(?:AM|PM)?(?:\\s*(?:GMT|UTC|[+-]\\d{2}:?\\d{2}))?)?)`, "gi"),
    "visible text"
  );
}

function collectDateMatches(value: string, pattern: RegExp, source: string) {
  return Array.from(value.matchAll(pattern))
    .map((match) => ({ publishedAt: normalizeDateValue(match[1]), source }))
    .filter((item) => item.publishedAt);
}

function readJsonDateValues(value: string, source: string): PublishedDateInfo[] {
  const decoded = decodeHtmlEntities(value);
  try {
    return collectJsonDates(JSON.parse(decoded), source);
  } catch {
    return collectDateMatches(decoded, /"(?:datePublished|dateCreated|dateModified|uploadDate)"\s*:\s*"([^"]+)"/gi, source);
  }
}

function collectJsonDates(value: unknown, source: string): PublishedDateInfo[] {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap((item) => collectJsonDates(item, source));
  return Object.entries(value as Record<string, unknown>).flatMap(([key, item]) => {
    if (["datePublished", "dateCreated", "dateModified", "uploadDate"].includes(key) && typeof item === "string") {
      const publishedAt = normalizeDateValue(item);
      return publishedAt ? [{ publishedAt, source }] : [];
    }
    return collectJsonDates(item, source);
  });
}

function normalizeDateValue(value?: string) {
  if (!value) return "";
  const decoded = value.replace(/&quot;/g, "\"").replace(/&#x2F;/gi, "/").trim();
  const parsed = Date.parse(decoded);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : "";
}

function extractArticleContent(html: string) {
  const cleaned = decodeHtmlEntities(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  const articleMatch = cleaned.match(/<article[\s\S]*?<\/article>/i);
  const body = articleMatch?.[0] || cleaned;
  const paragraphs = Array.from(body.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi))
    .map((match) => normalizeText(stripTags(match[1])))
    .filter((text) => text.length >= 40);
  const text = paragraphs.length >= 2 ? paragraphs.join("\n\n") : normalizeText(stripTags(body));
  return text.slice(0, 12_000);
}

function stripTags(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|article|h[1-6]|li)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;|&nbsp|&#160;|&#xA0;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function buildValidationResponse(
  item: MuNewsItem | undefined,
  valid: boolean,
  message: string,
  detailPublishedAt?: string,
  detailPublishedSource?: string,
  resolvedUrl?: string,
  articleContent?: string
): MuNewsValidateItemResponse {
  return {
    ok: true,
    valid,
    itemId: item?.id || "",
    message,
    sourcePublishedAt: item?.publishedAt || "",
    detailPublishedAt,
    detailPublishedSource,
    resolvedUrl,
    articleContent,
  };
}

function isGoogleNewsUrl(value: string) {
  try {
    return new URL(value).hostname === "news.google.com";
  } catch {
    return false;
  }
}
