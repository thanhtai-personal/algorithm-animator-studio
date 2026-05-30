import type { MuNewsItem, MuNewsValidateItemResponse } from "../models/MuNews";

const LINK_CHECK_TIMEOUT_MS = 7_000;
const DETAIL_FETCH_TIMEOUT_MS = 12_000;
const DETAIL_HTML_LIMIT = 2_000_000;
const MIN_ARTICLE_CONTENT_LENGTH = 280;

export type NewsDateWindow = {
  fromMs: number;
  toMs: number;
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
    return buildValidationResponse(item, false, "Không trích được nội dung bài viết đủ dài để tạo kịch bản.", undefined, article.url);
  }

  const detailPublishedAt = extractPublishedDate(article.html);
  if (!detailPublishedAt) return buildValidationResponse(item, false, "Không tìm thấy thời gian publish trong bài viết.", undefined, article.url);

  if (!isPublishedInWindow(detailPublishedAt, window)) {
    return buildValidationResponse(item, false, "Thời gian publish trong bài viết không nằm trong khoảng từ hôm qua đến hiện tại.", detailPublishedAt, article.url);
  }

  return buildValidationResponse(item, true, "Đã tải được nội dung bài viết và thời gian publish hợp lệ.", detailPublishedAt, article.url, articleContent);
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

function extractPublishedDate(html: string) {
  const patterns = [
    /<meta[^>]+(?:property|name|itemprop)=["'](?:article:published_time|og:published_time|pubdate|publishdate|date|datePublished|parsely-pub-date|sailthru\.date)["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name|itemprop)=["'](?:article:published_time|og:published_time|pubdate|publishdate|date|datePublished|parsely-pub-date|sailthru\.date)["']/i,
    /<time[^>]+datetime=["']([^"']+)["']/i,
    /"(?:datePublished|dateCreated|uploadDate)"\s*:\s*"([^"]+)"/i,
    /'(?:datePublished|dateCreated|uploadDate)'\s*:\s*'([^']+)'/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    const parsed = normalizeDateValue(match?.[1]);
    if (parsed) return parsed;
  }
  return "";
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
