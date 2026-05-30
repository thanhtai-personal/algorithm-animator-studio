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
const DEFAULT_SELECTOR = "body";
const DEFAULT_LINK_SELECTOR = "a[href]";

export function validateExtractTextRequest(body: ExtractTextBody) {
  const selector = String(body.selector || "").trim() || DEFAULT_SELECTOR;
  const urls = Array.isArray(body.urls) ? body.urls.map(normalizeHttpUrl).filter(Boolean) : [];

  if (!urls.length) return badRequest("Hãy nhập ít nhất 1 URL.");
  if (selector.length > 160) return badRequest("Selector quá dài.");

  return { selector, urls: Array.from(new Set(urls)) };
}

export function validateExtractLinksRequest(body: ExtractLinksBody) {
  const selector = String(body.selector || "").trim() || DEFAULT_LINK_SELECTOR;
  const url = normalizeHttpUrl(String(body.url || ""));

  if (!url) return badRequest("Hãy nhập URL trang chứa danh sách link.");
  if (selector.length > 160) return badRequest("Selector quá dài.");

  return { selector, url };
}

export async function extractTextFromUrls(params: { urls: string[]; selector: string }): Promise<ExtractTextResponse> {
  const results: ExtractedTextItem[] = [];

  for (const url of params.urls) {
    results.push(await extractTextFromSingleUrl(url, params.selector));
  }

  const combinedText = results
    .filter((item) => item.ok && item.text.trim())
    .map((item, index) => [`Nguồn ${index + 1}: ${item.title || item.url}`, item.text.trim()].join("\n"))
    .join("\n\n");

  return {
    ok: results.some((item) => item.ok),
    selector: params.selector,
    combinedText,
    characterCount: combinedText.length,
    results,
  };
}

export async function extractLinksFromPage(params: { url: string; selector: string }): Promise<ExtractLinksResponse> {
  const html = await fetchHtml(params.url);
  const links = extractLinks(html, params.url, params.selector);

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
    const title = decodeEntities(stripTags(matchFirst(html, /<title[^>]*>([\s\S]*?)<\/title>/i) || "")).trim();
    const selectedHtml = selectHtml(html, selector);
    const text = normalizeText(stripTags(removeNoise(selectedHtml)));

    return text
      ? { ok: true, url, title, text, characterCount: text.length }
      : { ok: false, url, title, text: "", characterCount: 0, error: "Không tìm thấy text khớp selector." };
  } catch (error) {
    return { ok: false, url, text: "", characterCount: 0, error: error instanceof Error ? error.message : "Không trích xuất được nội dung." };
  }
}

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AlgoShortsStoryExtractor/1.0)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5",
      },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain") && !contentType.includes("xml")) {
      throw new Error("URL không trả về HTML/text.");
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > MAX_HTML_BYTES) throw new Error("HTML vượt quá giới hạn 5MB.");
    return buffer.toString("utf8");
  } finally {
    clearTimeout(timeout);
  }
}

function extractLinks(html: string, baseUrl: string, selector: string): ExtractedLinkItem[] {
  const source = selector === DEFAULT_LINK_SELECTOR ? html : selectHtml(html, selector);
  const result: ExtractedLinkItem[] = [];
  const seen = new Set<string>();
  const anchorRegex = /<a\b([^>]*href=["'][^"']+["'][^>]*)>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorRegex.exec(source))) {
    const href = matchFirst(match[1], /href=["']([^"']+)["']/i);
    if (!href) continue;
    const normalized = normalizeLink(href, baseUrl);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push({ href: normalized, text: normalizeText(stripTags(match[2])) || normalized });
  }

  return result;
}

function selectHtml(html: string, selector: string): string {
  const trimmed = selector.trim();
  if (!trimmed || trimmed === "body" || trimmed === "html") return html;

  return trimmed
    .split(",")
    .map((part) => part.trim())
    .map((part) => selectBySimpleSelector(html, part))
    .filter(Boolean)
    .join("\n");
}

function selectBySimpleSelector(html: string, selector: string): string {
  if (selector.startsWith("#")) {
    const id = escapeRegex(selector.slice(1));
    return matchFirst(html, new RegExp(`<([a-z0-9-]+)\\b[^>]*id=["'][^"']*${id}[^"']*["'][^>]*>[\\s\\S]*?<\\/\\1>`, "i")) || "";
  }

  if (selector.startsWith(".")) {
    const className = escapeRegex(selector.slice(1));
    return collectMatches(html, new RegExp(`<([a-z0-9-]+)\\b[^>]*class=["'][^"']*${className}[^"']*["'][^>]*>[\\s\\S]*?<\\/\\1>`, "gi"));
  }

  const tag = selector.replace(/[^a-z0-9-]/gi, "");
  if (tag) return collectMatches(html, new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi"));

  return "";
}

function removeNoise(html: string) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
}

function stripTags(html: string) {
  return html.replace(/<br\s*\/?\s*>/gi, "\n").replace(/<\/p>|<\/div>|<\/h[1-6]>/gi, "\n").replace(/<[^>]+>/g, " ");
}

function normalizeText(text: string) {
  return decodeEntities(text).replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function decodeEntities(text: string) {
  return text
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;?/gi, " ")
    .replace(/&#160;|&#x[aA]0;/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function normalizeHttpUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function normalizeLink(href: string, baseUrl: string) {
  try {
    const url = new URL(href, baseUrl);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function matchFirst(input: string, regex: RegExp) {
  return input.match(regex)?.[1] || "";
}

function collectMatches(input: string, regex: RegExp) {
  return Array.from(input.matchAll(regex)).map((match) => match[0]).join("\n");
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function badRequest(message: string) {
  return { status: 400, body: { error: message } };
}
