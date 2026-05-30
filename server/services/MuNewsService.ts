import crypto from "node:crypto";
import { DEFAULT_MU_NEWS_SOURCES } from "../config/muNewsSources";
import type { MuNewsItem, MuNewsScriptBody, MuNewsScriptResponse, MuNewsSource } from "../models/MuNews";
import { createMuNewsDateWindow, isPublishedInWindow, validateNewsItemLink } from "./MuNewsValidationService";

const MAX_FEED_BYTES = 2 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 18_000;
const DEFAULT_QUERY = "Manchester United OR Man Utd OR MUFC";

export async function fetchMuNewsItems(params: { sources?: MuNewsSource[]; query?: string; maxItems?: number }) {
  const sources = normalizeSources(params.sources?.length ? params.sources : DEFAULT_MU_NEWS_SOURCES);
  const query = String(params.query || DEFAULT_QUERY).trim();
  const maxItems = clampNumber(params.maxItems, 12, 3, 40);
  const dateWindow = createMuNewsDateWindow();
  const fetched = await Promise.allSettled(sources.map((source) => fetchSourceItems(source)));
  const items = fetched.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  const dateFiltered = items.filter((item) => isPublishedInWindow(item.publishedAt, dateWindow));
  const queryFiltered = filterAndSortItems(dedupeItems(dateFiltered), query);
  const validationResults = await Promise.allSettled(queryFiltered.map(validateNewsItemLink));
  const validItems = queryFiltered.filter((_, index) => validationResults[index]?.status === "fulfilled" && (validationResults[index] as PromiseFulfilledResult<boolean>).value);
  const filtered = validItems.slice(0, maxItems);
  const invalidCount = queryFiltered.length - validItems.length;

  return {
    ok: filtered.length > 0,
    query,
    sources,
    count: filtered.length,
    items: filtered,
    dateWindow: {
      from: new Date(dateWindow.fromMs).toISOString(),
      to: new Date(dateWindow.toMs).toISOString(),
    },
    warnings: fetched
      .map((result, index) => result.status === "rejected" ? `${sources[index]?.name}: ${result.reason?.message || "Không tải được nguồn."}` : "")
      .filter(Boolean)
      .concat(invalidCount ? [`Đã bỏ ${invalidCount} tin không truy cập được hoặc bị chặn.`] : []),
  };
}

export async function generateMuNewsScript(body: MuNewsScriptBody): Promise<MuNewsScriptResponse> {
  const items = body.items.slice(0, 10);
  if (!items.length) throw new Error("Chưa chọn tin để tạo kịch bản.");

  const aiResult = await tryGenerateWithOpenAi({ ...body, items });
  if (aiResult) return aiResult;

  return generateLocalScript({ ...body, items }, "Chưa cấu hình OPENAI_API_KEY hoặc AI trả kết quả không hợp lệ, đã dùng bản dựng local.");
}

async function fetchSourceItems(source: MuNewsSource): Promise<MuNewsItem[]> {
  const xml = await fetchText(source.url);
  return parseFeedItems(xml, source);
}

async function fetchText(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; KATAMuNewsBot/1.0)",
        Accept: "application/rss+xml,application/xml,text/xml,text/html,text/plain,*/*;q=0.8",
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > MAX_FEED_BYTES) throw new Error("RSS/HTML vượt quá giới hạn 2MB.");
    return buffer.toString("utf8");
  } finally {
    clearTimeout(timeout);
  }
}

async function parseFeedItems(xml: string, source: MuNewsSource): Promise<MuNewsItem[]> {
  const blocks = collectBlocks(xml, "item").length ? collectBlocks(xml, "item") : collectBlocks(xml, "entry");

  const items = await Promise.all(blocks.map(async (block) => {
    const title = cleanHtmlText(readTag(block, "title"));
    const link = normalizeLink(readTag(block, "link") || readAtomLink(block), source.url);
    const feedSummary = cleanHtmlText(readTag(block, "description") || readTag(block, "summary") || readTag(block, "content"));
    const articleSummary = source.contentSelector ? await extractArticleSummary(link, source.contentSelector) : "";
    const summary = articleSummary || removeDuplicateLead(feedSummary, title);
    const publishedAt = parseDate(readTag(block, "pubDate") || readTag(block, "published") || readTag(block, "updated"));
    const id = crypto.createHash("sha1").update(`${source.id}:${title}:${link}`).digest("hex").slice(0, 16);

    return {
      id,
      sourceName: source.name,
      sourceUrl: source.url,
      title,
      link,
      summary: normalizeSpace(summary).slice(0, 900),
      publishedAt,
      trustScore: clampNumber(source.trustScore, 6, 1, 10),
    };
  }));

  return items.filter((item) => item.title && item.link);
}

async function extractArticleSummary(url: string, selector: string) {
  if (!url || !selector.trim()) return "";

  try {
    const html = await fetchText(url);
    const selectedHtml = selectHtml(html, selector);
    return normalizeSpace(cleanHtmlText(removeNoise(selectedHtml))).slice(0, 900);
  } catch {
    return "";
  }
}

async function tryGenerateWithOpenAi(body: MuNewsScriptBody): Promise<MuNewsScriptResponse | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const endpoint = `${(process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "")}/chat/completions`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
        temperature: 0.55,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: JSON.stringify(buildScriptInput(body), null, 2) },
        ],
      }),
    });

    if (!response.ok) throw new Error(`OpenAI HTTP ${response.status}`);
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI không trả nội dung.");
    return normalizeAiScriptResponse(JSON.parse(content));
  } catch {
    return null;
  }
}

function buildSystemPrompt() {
  return [
    "Bạn là biên tập viên kênh tin tức Manchester United cho fan Việt Nam.",
    "Chỉ dựa trên nguồn người dùng cung cấp; không bịa thêm số liệu, phát biểu hoặc tin chính thức.",
    "Không dịch nguyên văn bài báo; hãy tổng hợp lại bằng lời mới, có góc nhìn fan MU Việt.",
    "Tin chưa chính thức phải gọi là tin đồn/tin đáng theo dõi, không được nói là chốt hoặc chính thức.",
    "Viết theo đúng ngôn ngữ scriptLanguage trong input, mặc định là Tiếng Việt.",
    "Trả về JSON với các field: title, script, description, hashtags, shorts, sourceNotes.",
  ].join("\n");
}

function buildScriptInput(body: MuNewsScriptBody) {
  return {
    channelName: body.channelName || "Bản Tin Quỷ Đỏ",
    angle: body.angle || "Bản tin MU hôm nay: tin thật, tin đồn và góc nhìn fan Việt.",
    durationMinutes: clampNumber(body.durationMinutes, 6, 2, 12),
    voiceStyle: body.voiceStyle || "Gần gũi, tỉnh táo, không giật tít sai sự thật.",
    scriptLanguage: body.scriptLanguage || "Tiếng Việt",
    items: body.items.map((item) => ({
      title: item.title,
      sourceName: item.sourceName,
      link: item.link,
      summary: item.summary,
      publishedAt: item.publishedAt,
      trustScore: item.trustScore,
    })),
  };
}

function generateLocalScript(body: MuNewsScriptBody, warning?: string): MuNewsScriptResponse {
  const channelName = body.channelName || "Bản Tin Quỷ Đỏ";
  const sorted = [...body.items].sort((a, b) => b.trustScore - a.trustScore).slice(0, 6);
  const lead = sorted[0];
  const title = lead ? `MU hôm nay: ${lead.title}` : "Bản tin MU hôm nay";
  const paragraphs = [
    `Xin chào anh em fan MU. Đây là ${channelName}. Hôm nay chúng ta có ${sorted.length} tin đáng chú ý về Manchester United. Mình sẽ đi theo thứ tự: tin đáng tin nhất trước, tin đồn sau, và luôn ghi rõ nguồn để anh em tự đánh giá.`,
    ...sorted.map((item, index) => buildLocalNewsParagraph(item, index)),
    "Tổng kết lại, tin đáng theo dõi nhất hôm nay là tin có nguồn mạnh nhất và ảnh hưởng trực tiếp tới kế hoạch đội hình. Còn các tin chuyển nhượng chưa được CLB xác nhận thì anh em cứ xem là tín hiệu tham khảo, không nên vội tin tuyệt đối.",
    "Anh em nghĩ tin nào đáng tin nhất hôm nay? Bình luận bên dưới để mình làm tiếp bản phân tích sâu hơn cho thương vụ hoặc vấn đề đó nhé.",
  ];

  return {
    ok: true,
    engine: "local-fallback",
    title,
    script: paragraphs.join("\n\n"),
    description: buildDescription(sorted),
    hashtags: ["#MUFC", "#ManchesterUnited", "#QuyDo", "#BongDaAnh", "#TinMU"],
    shorts: sorted.slice(0, 3).map((item) => ({
      title: `Short MU: ${item.title.slice(0, 72)}`,
      script: `Tin nhanh MU: ${item.title}. Nguồn: ${item.sourceName}. Độ tin cậy tạm chấm ${item.trustScore}/10. Đây là tin ${item.trustScore >= 8 ? "đáng chú ý" : "cần theo dõi thêm"}, chưa nên thổi thành kết luận nếu CLB chưa xác nhận.`,
    })),
    sourceNotes: sorted.map((item) => `${item.sourceName} — ${item.title}`),
    warning,
  };
}

function buildLocalNewsParagraph(item: MuNewsItem, index: number) {
  const status = item.trustScore >= 8 ? "nguồn khá mạnh" : item.trustScore >= 6 ? "nguồn ở mức theo dõi" : "nguồn còn yếu";
  const summary = item.summary ? ` Nội dung chính: ${item.summary}` : "";
  return `Tin số ${index + 1}: ${item.title}. Nguồn: ${item.sourceName}, độ tin cậy tạm chấm ${item.trustScore}/10, tức là ${status}.${summary} Góc nhìn fan MU: tin này nên được đặt trong bối cảnh hiện tại của đội bóng, ưu tiên là tính ổn định, chiều sâu đội hình và khả năng kiểm chứng từ nguồn chính thức.`;
}

function buildDescription(items: MuNewsItem[]) {
  return [
    "Bản tin MU được tổng hợp, biên tập và đọc với sự hỗ trợ của AI. Đây là kênh fan độc lập, không liên kết với Manchester United.",
    "Nguồn tham khảo:",
    ...items.map((item, index) => `${index + 1}. ${item.sourceName}: ${item.link}`),
  ].join("\n");
}

function normalizeAiScriptResponse(value: any): MuNewsScriptResponse {
  if (!value?.script || !value?.title) throw new Error("Thiếu title/script.");
  return {
    ok: true,
    engine: "openai",
    title: String(value.title),
    script: String(value.script),
    description: String(value.description || ""),
    hashtags: Array.isArray(value.hashtags) ? value.hashtags.map(String) : ["#MUFC", "#ManchesterUnited"],
    shorts: Array.isArray(value.shorts) ? value.shorts.slice(0, 5).map((item: any) => ({ title: String(item.title || "Short MU"), script: String(item.script || "") })) : [],
    sourceNotes: Array.isArray(value.sourceNotes) ? value.sourceNotes.map(String) : [],
  };
}

function filterAndSortItems(items: MuNewsItem[], query: string) {
  const terms = query.toLowerCase().split(/\s+or\s+|[,;]+/i).map((term) => term.replace(/["']/g, "").trim()).filter(Boolean);
  const filtered = items.filter((item) => {
    const haystack = `${item.title} ${item.summary}`.toLowerCase();
    return !terms.length || terms.some((term) => haystack.includes(term.toLowerCase()));
  });

  return filtered.sort((a, b) => {
    const dateDiff = Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
    return dateDiff || b.trustScore - a.trustScore;
  });
}

function dedupeItems(items: MuNewsItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalizeSpace(item.title).toLowerCase().replace(/[^a-z0-9]+/g, " ").slice(0, 96);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeSources(sources: MuNewsSource[]) {
  return sources.map((source, index) => ({
    id: source.id || `source-${index + 1}`,
    name: source.name || `Nguồn ${index + 1}`,
    url: source.url,
    trustScore: clampNumber(source.trustScore, 6, 1, 10),
    contentSelector: String(source.contentSelector || "").trim().slice(0, 160),
    sourceType: source.sourceType || "rss",
  })).filter((source) => /^https?:\/\//i.test(source.url));
}

function collectBlocks(input: string, tag: string) {
  return Array.from(input.matchAll(new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, "gi"))).map((match) => match[0]);
}

function readTag(block: string, tag: string) {
  return block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1] || "";
}

function readAtomLink(block: string) {
  return block.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i)?.[1] || "";
}

function normalizeLink(value: string, baseUrl: string) {
  try { return new URL(decodeEntities(value.trim()), baseUrl).toString(); } catch { return ""; }
}

function parseDate(value: string) {
  const date = new Date(decodeEntities(value.trim()));
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function cleanHtmlText(value: string) {
  return normalizeSpace(stripTags(decodeEntities(value)));
}

function removeDuplicateLead(summary: string, title: string) {
  const normalizedTitle = normalizeSpace(title);
  const normalizedSummary = normalizeSpace(summary);
  if (!normalizedTitle || !normalizedSummary) return normalizedSummary;

  const withoutTitle = normalizedSummary.toLowerCase().startsWith(normalizedTitle.toLowerCase())
    ? normalizedSummary.slice(normalizedTitle.length).trim()
    : normalizedSummary;

  return withoutTitle.replace(/^[-–—:|,\s]+/, "").trim() || normalizedSummary;
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
    return html.match(new RegExp(`<([a-z0-9-]+)\\b[^>]*id=["'][^"']*${id}[^"']*["'][^>]*>[\\s\\S]*?<\\/\\1>`, "i"))?.[0] || "";
  }

  if (selector.startsWith(".")) {
    const className = escapeRegex(selector.slice(1));
    return Array.from(html.matchAll(new RegExp(`<([a-z0-9-]+)\\b[^>]*class=["'][^"']*${className}[^"']*["'][^>]*>[\\s\\S]*?<\\/\\1>`, "gi"))).map((match) => match[0]).join("\n");
  }

  const tag = selector.replace(/[^a-z0-9-]/gi, "");
  if (!tag) return "";
  return Array.from(html.matchAll(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi"))).map((match) => match[0]).join("\n");
}

function removeNoise(html: string) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
}

function stripTags(html: string) {
  return html.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, " ");
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

function normalizeSpace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function clampNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
