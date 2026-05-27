import crypto from "node:crypto";
import type { MuNewsItem, MuNewsScriptBody, MuNewsScriptResponse, MuNewsSource } from "../models/MuNews";

const MAX_FEED_BYTES = 2 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 18_000;
const DEFAULT_QUERY = "Manchester United OR Man Utd OR MUFC";

export const DEFAULT_MU_NEWS_SOURCES: MuNewsSource[] = [
  {
    id: "google-mu-24h",
    name: "Google News — Manchester United 24h",
    url: "https://news.google.com/rss/search?q=%22Manchester%20United%22%20OR%20%22Man%20United%22%20OR%20MUFC%20when%3A1d&hl=en-GB&gl=GB&ceid=GB%3Aen",
    trustScore: 6,
    sourceType: "news-search",
  },
  {
    id: "google-mu-transfer",
    name: "Google News — MU Transfer",
    url: "https://news.google.com/rss/search?q=%22Manchester%20United%22%20transfer%20when%3A7d&hl=en-GB&gl=GB&ceid=GB%3Aen",
    trustScore: 6,
    sourceType: "news-search",
  },
  {
    id: "bbc-football",
    name: "BBC Sport Football RSS",
    url: "https://feeds.bbci.co.uk/sport/football/rss.xml",
    trustScore: 9,
    sourceType: "rss",
  },
];

export async function fetchMuNewsItems(params: { sources?: MuNewsSource[]; query?: string; maxItems?: number }) {
  const sources = normalizeSources(params.sources?.length ? params.sources : DEFAULT_MU_NEWS_SOURCES);
  const query = String(params.query || DEFAULT_QUERY).trim();
  const maxItems = clampNumber(params.maxItems, 12, 3, 40);
  const fetched = await Promise.allSettled(sources.map((source) => fetchSourceItems(source)));
  const items = fetched.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  const filtered = filterAndSortItems(dedupeItems(items), query).slice(0, maxItems);

  return {
    ok: filtered.length > 0,
    query,
    sources,
    count: filtered.length,
    items: filtered,
    warnings: fetched
      .map((result, index) => result.status === "rejected" ? `${sources[index]?.name}: ${result.reason?.message || "Không tải được nguồn."}` : "")
      .filter(Boolean),
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

function parseFeedItems(xml: string, source: MuNewsSource): MuNewsItem[] {
  const blocks = collectBlocks(xml, "item").length ? collectBlocks(xml, "item") : collectBlocks(xml, "entry");

  return blocks.map((block) => {
    const title = decodeEntities(stripTags(readTag(block, "title"))).trim();
    const link = normalizeLink(readTag(block, "link") || readAtomLink(block), source.url);
    const summary = decodeEntities(stripTags(readTag(block, "description") || readTag(block, "summary") || readTag(block, "content"))).trim();
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
  }).filter((item) => item.title && item.link);
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

function stripTags(html: string) {
  return html.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, " ");
}

function decodeEntities(text: string) {
  return text.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function normalizeSpace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function clampNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}
