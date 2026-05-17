import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import type {
  ExtractedLinkItem,
  ExtractedTextItem,
  ExtractLinksBody,
  ExtractLinksResponse,
  ExtractTextBody,
  ExtractTextResponse,
} from "../models/WebExtract";

const MAX_HTML_BYTES = 5 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 20_000;
const POLITE_FETCH_DELAY_MS = 1_250;
const SAME_HOST_FETCH_DELAY_MS = 2_000;
const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);
const DEFAULT_SELECTOR = "body";
const DEFAULT_LINK_SELECTOR = "a[href]";

export type ExtractValidationResult =
  | {
      urls: string[];
      selector: string;
    }
  | {
      status: number;
      body: Record<string, unknown>;
    };

export type ExtractLinksValidationResult =
  | {
      url: string;
      selector: string;
    }
  | {
      status: number;
      body: Record<string, unknown>;
    };

export function validateExtractTextRequest(body: ExtractTextBody): ExtractValidationResult {
  const selector = String(body.selector || "").trim() || DEFAULT_SELECTOR;
  const urls = Array.isArray(body.urls)
    ? body.urls.map((url) => String(url || "").trim()).filter(Boolean)
    : [];

  if (!urls.length) {
    return badRequest("Hãy nhập ít nhất 1 URL.");
  }

  const selectorValidation = validateSelector(selector);
  if (selectorValidation) {
    return badRequest(selectorValidation);
  }

  const normalizedUrls: string[] = [];
  const seenUrls = new Set<string>();
  for (const rawUrl of urls) {
    const validation = normalizeHttpUrl(rawUrl);
    if ("error" in validation) {
      return badRequest(validation.error);
    }

    if (!seenUrls.has(validation.url)) {
      seenUrls.add(validation.url);
      normalizedUrls.push(validation.url);
    }
  }

  return {
    selector,
    urls: normalizedUrls,
  };
}

export function validateExtractLinksRequest(body: ExtractLinksBody): ExtractLinksValidationResult {
  const selector = String(body.selector || "").trim() || DEFAULT_LINK_SELECTOR;
  const rawUrl = String(body.url || "").trim();

  if (!rawUrl) {
    return badRequest("Hãy nhập URL trang chứa danh sách link.");
  }

  const urlValidation = normalizeHttpUrl(rawUrl);
  if ("error" in urlValidation) {
    return badRequest(urlValidation.error);
  }

  const selectorValidation = validateSelector(selector);
  if (selectorValidation) {
    return badRequest(selectorValidation);
  }

  return {
    selector,
    url: urlValidation.url,
  };
}

export async function extractTextFromUrls(params: {
  urls: string[];
  selector: string;
}): Promise<ExtractTextResponse> {
  const results: ExtractedTextItem[] = [];

  for (const [index, url] of params.urls.entries()) {
    if (index > 0) {
      await wait(getPoliteFetchDelay(params.urls[index - 1], url));
    }

    results.push(await extractTextFromSingleUrl(url, params.selector));
  }

  const combinedText = results
    .filter((item) => item.ok && item.text.trim())
    .map((item, index) => {
      const sourceTitle = item.title?.trim() || item.url;
      return [`Nguồn ${index + 1}: ${sourceTitle}`, item.text.trim()].join("\n");
    })
    .join("\n\n");

  return {
    ok: results.some((item) => item.ok),
    selector: params.selector,
    combinedText,
    characterCount: combinedText.length,
    results,
  };
}

export async function extractLinksFromPage(params: {
  url: string;
  selector: string;
}): Promise<ExtractLinksResponse> {
  const html = await fetchHtml(params.url);
  const $ = cheerio.load(html);
  const links: ExtractedLinkItem[] = [];
  const seen = new Set<string>();
  const nodes = $(params.selector);

  nodes.each((_, element) => {
    collectLinkFromElement($, element, params.url, links, seen);

    $(element)
      .find("a[href]")
      .each((__, child) => {
        collectLinkFromElement($, child, params.url, links, seen);
      });
  });

  return {
    ok: Boolean(links.length),
    url: params.url,
    selector: params.selector,
    count: links.length,
    links,
  };
}

async function extractTextFromSingleUrl(url: string, selector: string): Promise<ExtractedTextItem> {
  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    const title = normalizeWhitespace($("title").first().text());
    const nodes = $(selector);

    if (!nodes.length) {
      return {
        ok: false,
        url,
        title,
        text: "",
        characterCount: 0,
        error: "Không tìm thấy phần tử nào khớp selector.",
      };
    }

    const text = nodes
      .map((_, element) => normalizeExtractedText($(element).text()))
      .get()
      .filter(Boolean)
      .join("\n\n");

    return {
      ok: Boolean(text.trim()),
      url,
      title,
      text,
      characterCount: text.length,
      error: text.trim() ? undefined : "Phần tử tìm thấy nhưng không có text.",
    };
  } catch (error) {
    return {
      ok: false,
      url,
      text: "",
      characterCount: 0,
      error: error instanceof Error ? error.message : "Không trích xuất được nội dung.",
    };
  }
}

function collectLinkFromElement(
  $: cheerio.CheerioAPI,
  element: Element,
  baseUrl: string,
  links: ExtractedLinkItem[],
  seen: Set<string>
) {
  const rawHref = $(element).attr("href");
  if (!rawHref) {
    return;
  }

  const normalized = normalizeLinkHref(rawHref, baseUrl);
  if (!normalized || seen.has(normalized)) {
    return;
  }

  seen.add(normalized);
  links.push({
    href: normalized,
    text: normalizeWhitespace($(element).text()) || normalized,
  });
}

async function fetchHtml(url: string): Promise<string> {
  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fetchHtmlOnce(url);
    } catch (error) {
      lastError = error;

      if (!isRetryableFetchError(error) || attempt === maxAttempts) {
        break;
      }

      await wait(getRetryDelayMs(error, attempt));
    }
  }

  throw lastError;
}

async function fetchHtmlOnce(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; KataStudioTextExtractor/1.0; +local-use)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5",
        "Accept-Language": "vi,en;q=0.8",
        "Cache-Control": "no-cache",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw createFetchStatusError(response);
    }

    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > MAX_HTML_BYTES) {
      throw new Error("HTML quá lớn. Giới hạn mỗi URL là 5MB.");
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType && !/text|html|xml/i.test(contentType)) {
      throw new Error(`Nội dung không phải HTML/text: ${contentType}.`);
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_HTML_BYTES) {
      throw new Error("HTML quá lớn. Giới hạn mỗi URL là 5MB.");
    }

    return new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Fetch quá lâu. Hãy thử URL khác hoặc selector hẹp hơn.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function getPoliteFetchDelay(previousUrl: string, currentUrl: string): number {
  try {
    const previousHost = new URL(previousUrl).hostname;
    const currentHost = new URL(currentUrl).hostname;
    return previousHost === currentHost ? SAME_HOST_FETCH_DELAY_MS : POLITE_FETCH_DELAY_MS;
  } catch {
    return POLITE_FETCH_DELAY_MS;
  }
}

function createFetchStatusError(response: Response): Error {
  const error = new Error(`Fetch thất bại với HTTP ${response.status}.`);
  const retryAfter = response.headers.get("retry-after");

  Object.assign(error, {
    retryAfter,
    status: response.status,
  });

  return error;
}

function isRetryableFetchError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const status = Number((error as Error & { status?: number }).status || 0);
  return RETRYABLE_STATUS_CODES.has(status);
}

function getRetryDelayMs(error: unknown, attempt: number): number {
  const retryAfter = error instanceof Error ? (error as Error & { retryAfter?: string }).retryAfter : undefined;
  const parsedRetryAfter = Number(retryAfter || 0);

  if (Number.isFinite(parsedRetryAfter) && parsedRetryAfter > 0) {
    return Math.min(parsedRetryAfter * 1000, 30_000);
  }

  return Math.min(2_000 * attempt ** 2, 15_000);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function validateSelector(selector: string): string | null {
  try {
    cheerio.load("<main><p>test</p><a href='/x'>x</a></main>")(selector);
    return null;
  } catch (error) {
    return `Query selector không hợp lệ: ${error instanceof Error ? error.message : "không rõ lỗi"}`;
  }
}

function normalizeHttpUrl(rawUrl: string): { url: string } | { error: string } {
  try {
    const url = new URL(rawUrl);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { error: `URL chỉ được dùng http hoặc https: ${rawUrl}` };
    }

    if (!url.hostname) {
      return { error: `URL không hợp lệ: ${rawUrl}` };
    }

    return { url: url.toString() };
  } catch {
    return { error: `URL không hợp lệ: ${rawUrl}` };
  }
}

function normalizeLinkHref(rawHref: string, baseUrl: string): string | null {
  const trimmed = rawHref.trim();

  if (!trimmed || trimmed.startsWith("#") || /^javascript:/i.test(trimmed) || /^mailto:/i.test(trimmed) || /^tel:/i.test(trimmed)) {
    return null;
  }

  try {
    const url = new URL(trimmed, baseUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function normalizeExtractedText(text: string): string {
  return text
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ")
    .split("\n")
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeWhitespace(text: string): string {
  return text.replace(/[\t ]+/g, " ").trim();
}

function badRequest(error: string) {
  return {
    status: 400,
    body: { error },
  };
}
