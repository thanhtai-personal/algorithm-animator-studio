import { DEFAULT_CATEGORY_IDS } from "@/features/categories/constants";
import { Transaction, TransactionType, CategoryType } from "../../features/voice-transaction/types/transaction";
import { CategoryRow } from "@/features/categories/types";

// Multi-language keywords for income
const incomeKeywords: Record<string, string[]> = {
  vi: ["nhận", "lương", "thưởng", "được", "thu", "tiền về", "chuyển đến", "lãi", "đầu tư", "được tặng", "ai cho", "bán được"],
  en: ["receive", "received", "salary", "wage", "bonus", "earn", "earned", "income", "paid", "refund", "dividend", "interest", "profit", "gift received", "sold"],
  zh: ["收入", "工资", "奖金", "收到", "赚", "利息", "分红", "投资收益", "礼物", "卖出"],
  ko: ["받다", "급여", "월급", "보너스", "수입", "이자", "배당", "투자수익", "선물받음", "판매"],
  ja: ["受け取る", "給料", "ボーナス", "収入", "利息", "配当", "投資収益", "ギフト", "売却"],
  hi: ["प्राप्त", "वेतन", "बोनस", "आय", "ब्याज", "लाभांश", "निवेश", "उपहार", "बिक्री"],
};

// Multi-language keywords for expense
const expenseKeywords: Record<string, string[]> = {
  vi: ["mua", "ăn", "uống", "chi", "trả", "thanh toán", "đi", "xem", "tiêu", "nạp", "đổ xăng", "đóng", "gửi", "tặng", "cho", "mất"],
  en: ["buy", "bought", "purchase", "eat", "food", "drink", "pay", "paid", "payment", "spend", "spent", "expense", "cost", "fill", "gas", "fuel", "gift", "give", "gave"],
  zh: ["买", "购买", "吃", "喝", "支付", "花费", "消费", "加油", "送礼", "给"],
  ko: ["구매", "사다", "먹다", "마시다", "지불", "비용", "소비", "주유", "선물", "주다"],
  ja: ["買う", "購入", "食べる", "飲む", "支払う", "費用", "消費", "給油", "ギフト", "あげる"],
  hi: ["खरीदना", "खाना", "पीना", "भुगतान", "खर्च", "ईंधन", "उपहार", "देना"],
};

// Multi-language category keyword mapping
const categoryKeywordMap: Record<string, Record<string, CategoryType>> = {
  vi: {
    // Income categories
    lương: "salary",
    thưởng: "bonus",
    "đầu tư": "investment",
    lãi: "investment",
    "cổ phiếu": "investment",
    "được tặng": "gift_received",
    "ai cho": "gift_received",
    // Expense categories
    ăn: "food",
    uống: "food",
    "cà phê": "food",
    cơm: "food",
    phở: "food",
    bún: "food",
    "nhà hàng": "food",
    quán: "food",
    grab: "transport",
    taxi: "transport",
    xe: "transport",
    xăng: "transport",
    "đổ xăng": "transport",
    gojek: "transport",
    be: "transport",
    mua: "shopping",
    "quần áo": "shopping",
    giày: "shopping",
    shopee: "shopping",
    lazada: "shopping",
    "xem phim": "entertainment",
    phim: "entertainment",
    game: "entertainment",
    "giải trí": "entertainment",
    karaoke: "entertainment",
    thuốc: "health",
    "bệnh viện": "health",
    khám: "health",
    "bác sĩ": "health",
    học: "education",
    sách: "education",
    "khóa học": "education",
    điện: "bills",
    nước: "bills",
    internet: "bills",
    wifi: "bills",
    "điện thoại": "bills",
    tặng: "gift_given",
    "cho bạn": "gift_given",
  },
  en: {
    // Income categories
    salary: "salary",
    wage: "salary",
    bonus: "bonus",
    investment: "investment",
    stock: "investment",
    dividend: "investment",
    interest: "investment",
    "gift received": "gift_received",
    // Expense categories
    food: "food",
    eat: "food",
    lunch: "food",
    dinner: "food",
    breakfast: "food",
    coffee: "food",
    restaurant: "food",
    cafe: "food",
    grab: "transport",
    taxi: "transport",
    uber: "transport",
    car: "transport",
    gas: "transport",
    fuel: "transport",
    petrol: "transport",
    shopping: "shopping",
    clothes: "shopping",
    shoes: "shopping",
    amazon: "shopping",
    "online shopping": "shopping",
    movie: "entertainment",
    cinema: "entertainment",
    game: "entertainment",
    entertainment: "entertainment",
    karaoke: "entertainment",
    medicine: "health",
    hospital: "health",
    doctor: "health",
    clinic: "health",
    pharmacy: "health",
    education: "education",
    book: "education",
    course: "education",
    tuition: "education",
    electricity: "bills",
    water: "bills",
    internet: "bills",
    wifi: "bills",
    phone: "bills",
    rent: "bills",
    gift: "gift_given",
  },
  zh: {
    // Income categories
    工资: "salary",
    奖金: "bonus",
    投资: "investment",
    股票: "investment",
    利息: "investment",
    分红: "investment",
    礼物: "gift_received",
    // Expense categories
    食物: "food",
    吃饭: "food",
    午餐: "food",
    晚餐: "food",
    早餐: "food",
    咖啡: "food",
    餐厅: "food",
    出租车: "transport",
    打车: "transport",
    汽车: "transport",
    加油: "transport",
    购物: "shopping",
    衣服: "shopping",
    鞋子: "shopping",
    电影: "entertainment",
    游戏: "entertainment",
    娱乐: "entertainment",
    卡拉OK: "entertainment",
    药: "health",
    医院: "health",
    医生: "health",
    教育: "education",
    书: "education",
    课程: "education",
    电费: "bills",
    水费: "bills",
    网费: "bills",
    电话费: "bills",
    房租: "bills",
    送礼: "gift_given",
  },
  ko: {
    // Income categories
    급여: "salary",
    월급: "salary",
    보너스: "bonus",
    투자: "investment",
    주식: "investment",
    이자: "investment",
    배당: "investment",
    선물: "gift_received",
    // Expense categories
    음식: "food",
    식사: "food",
    점심: "food",
    저녁: "food",
    아침: "food",
    커피: "food",
    식당: "food",
    택시: "transport",
    차: "transport",
    주유: "transport",
    쇼핑: "shopping",
    옷: "shopping",
    신발: "shopping",
    영화: "entertainment",
    게임: "entertainment",
    오락: "entertainment",
    노래방: "entertainment",
    약: "health",
    병원: "health",
    의사: "health",
    교육: "education",
    책: "education",
    수업: "education",
    전기료: "bills",
    수도료: "bills",
    인터넷: "bills",
    전화료: "bills",
    월세: "bills",
    선물주기: "gift_given",
  },
  ja: {
    // Income categories
    給料: "salary",
    ボーナス: "bonus",
    投資: "investment",
    株: "investment",
    利息: "investment",
    配当: "investment",
    ギフト: "gift_received",
    // Expense categories
    食べ物: "food",
    食事: "food",
    昼食: "food",
    夕食: "food",
    朝食: "food",
    コーヒー: "food",
    レストラン: "food",
    タクシー: "transport",
    車: "transport",
    ガソリン: "transport",
    給油: "transport",
    買い物: "shopping",
    服: "shopping",
    靴: "shopping",
    映画: "entertainment",
    ゲーム: "entertainment",
    娯楽: "entertainment",
    カラオケ: "entertainment",
    薬: "health",
    病院: "health",
    医者: "health",
    教育: "education",
    本: "education",
    授業: "education",
    電気代: "bills",
    水道代: "bills",
    インターネット: "bills",
    電話代: "bills",
    家賃: "bills",
    プレゼント: "gift_given",
  },
  hi: {
    // Income categories
    वेतन: "salary",
    बोनस: "bonus",
    निवेश: "investment",
    शेयर: "investment",
    ब्याज: "investment",
    लाभांश: "investment",
    उपहार: "gift_received",
    // Expense categories
    भोजन: "food",
    खाना: "food",
    दोपहर: "food",
    रात: "food",
    नाश्ता: "food",
    कॉफी: "food",
    रेस्तरां: "food",
    टैक्सी: "transport",
    कार: "transport",
    ईंधन: "transport",
    खरीदारी: "shopping",
    कपड़े: "shopping",
    जूते: "shopping",
    फिल्म: "entertainment",
    गेम: "entertainment",
    मनोरंजन: "entertainment",
    दवा: "health",
    अस्पताल: "health",
    डॉक्टर: "health",
    शिक्षा: "education",
    किताब: "education",
    पाठ्यक्रम: "education",
    बिजली: "bills",
    पानी: "bills",
    इंटरनेट: "bills",
    फोन: "bills",
    किराया: "bills",
    उपहार_देना: "gift_given",
  },
};

// Multi-language amount parsing patterns
const amountPatterns: Record<string, Array<{ regex: RegExp; multiplier: number }>> = {
  vi: [
    { regex: /(\d+(?:[.,]\d+)?)\s*(?:tỷ|ty)/i, multiplier: 1000000000 },
    { regex: /(\d+(?:[.,]\d+)?)\s*(?:triệu|trieu)/i, multiplier: 1000000 },
    { regex: /(\d+(?:[.,]\d+)?)\s*tr\b/i, multiplier: 1000000 },
    { regex: /(\d+(?:[.,]\d+)?)\s*(?:nghìn|ngàn|nghin|ngan)/i, multiplier: 1000 },
    { regex: /(\d+(?:[.,]\d+)?)\s*k\b/i, multiplier: 1000 },
  ],
  en: [
    { regex: /(\d+(?:[.,]\d+)?)\s*billion/i, multiplier: 1000000000 },
    { regex: /(\d+(?:[.,]\d+)?)\s*million/i, multiplier: 1000000 },
    { regex: /(\d+(?:[.,]\d+)?)\s*k\b/i, multiplier: 1000 },
    { regex: /(\d+(?:[.,]\d+)?)\s*thousand/i, multiplier: 1000 },
  ],
  zh: [
    { regex: /(\d+(?:[.,]\d+)?)\s*亿/i, multiplier: 100000000 },
    { regex: /(\d+(?:[.,]\d+)?)\s*万/i, multiplier: 10000 },
    { regex: /(\d+(?:[.,]\d+)?)\s*千/i, multiplier: 1000 },
  ],
  ko: [
    { regex: /(\d+(?:[.,]\d+)?)\s*억/i, multiplier: 100000000 },
    { regex: /(\d+(?:[.,]\d+)?)\s*만/i, multiplier: 10000 },
    { regex: /(\d+(?:[.,]\d+)?)\s*천/i, multiplier: 1000 },
  ],
  ja: [
    { regex: /(\d+(?:[.,]\d+)?)\s*億/i, multiplier: 100000000 },
    { regex: /(\d+(?:[.,]\d+)?)\s*万/i, multiplier: 10000 },
    { regex: /(\d+(?:[.,]\d+)?)\s*千/i, multiplier: 1000 },
  ],
  hi: [
    { regex: /(\d+(?:[.,]\d+)?)\s*करोड़/i, multiplier: 10000000 },
    { regex: /(\d+(?:[.,]\d+)?)\s*लाख/i, multiplier: 100000 },
    { regex: /(\d+(?:[.,]\d+)?)\s*हज़ार/i, multiplier: 1000 },
  ],
};

export function detectLanguage(text: string): string {
  // Simple language detection based on character ranges
  const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text);
  const hasChinese = /[\u4e00-\u9fff]/i.test(text);
  const hasKorean = /[\uac00-\ud7af]/i.test(text);
  const hasJapanese = /[\u3040-\u309f\u30a0-\u30ff]/i.test(text);
  const hasHindi = /[\u0900-\u097f]/i.test(text);
  const normalized = normalizeForMatch(text);
  const viHints = ["nhan", "luong", "thu", "chi", "trieu", "nghin", "ngan", "dong"];
  const hasVietnameseHint = viHints.some((kw) => normalized.includes(kw));

  if (hasVietnamese) return "vi";
  if (hasVietnameseHint) return "vi";
  if (hasChinese) return "zh";
  if (hasKorean) return "ko";
  if (hasJapanese) return "ja";
  if (hasHindi) return "hi";
  return "en"; // Default to English
}

export function parseAmount(text: string, language: string = "vi"): number {
  // Normalize text
  const normalized = text.toLowerCase().replace(/,/g, "").trim();
  const normalizedNoDiacritics = normalizeForMatch(text).replace(/,/g, "").trim();
  const langKey = language.includes("-") ? language.split("-")[0] : language;

  // Get language-specific patterns or fallback to Vietnamese
  const patterns = amountPatterns[langKey] || amountPatterns.vi;

  // Try each pattern in order
  for (const { regex, multiplier } of patterns) {
    const match = normalized.match(regex) ?? normalizedNoDiacritics.match(regex);
    if (match && match[1]) {
      const number = parseFloat(match[1].replace(/\./g, ""));
      if (number > 0) {
        return Math.round(number * multiplier);
      }
    }
  }
  // Fallback: just find numbers and interpret them
  const matches = normalized.match(/\d+(?:[.,]\d+)?/g);
  if (!matches) return 0;

  const numbers = matches.map((m) => parseFloat(m.replace(/\./g, "").replace(/,/g, "."))).filter((n) => n > 0);
  return numbers.length > 0 ? Math.round(Math.max(...numbers)) : 0;
}

function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function buildKeywordMatcher(text: string) {
  const normalizedText = normalizeForMatch(text);
  const textTokens = normalizedText.split(/[^a-z0-9]+/g).filter(Boolean);
  const textTokenSet = new Set(textTokens);

  const matchesKeyword = (keyword: string) => {
    const normalizedKeyword = normalizeForMatch(keyword);
    const keywordTokens = normalizedKeyword.split(/[^a-z0-9]+/g).filter(Boolean);

    if (textTokens.length === 0 || keywordTokens.length === 0) {
      return normalizedText.includes(normalizedKeyword);
    }

    if (keywordTokens.length === 1) {
      return textTokenSet.has(keywordTokens[0]);
    }

    for (let i = 0; i <= textTokens.length - keywordTokens.length; i += 1) {
      let matched = true;
      for (let j = 0; j < keywordTokens.length; j += 1) {
        if (textTokens[i + j] !== keywordTokens[j]) {
          matched = false;
          break;
        }
      }
      if (matched) return true;
    }
    return false;
  };

  return { normalizedText, matchesKeyword };
}

function detectType(text: string, language: string = "vi"): TransactionType {
  const { matchesKeyword } = buildKeywordMatcher(text);

  // Get language-specific keywords or fallback to Vietnamese
  const incomeKw = incomeKeywords[language] || incomeKeywords.vi;
  const expenseKw = expenseKeywords[language] || expenseKeywords.vi;

  const incomeScore = incomeKw.filter(matchesKeyword).length;
  const expenseScore = expenseKw.filter(matchesKeyword).length;

  return incomeScore > expenseScore ? "income" : "expense";
}

function detectCategoryByList(text: string, categories: Array<CategoryRow>): string {
  const { matchesKeyword } = buildKeywordMatcher(text);
  // Ưu tiên tìm category theo tên trong danh sách categories
  for (const cat of categories) {
    if (matchesKeyword(cat.name)) {
      return cat.id;
    }
  }
  return DEFAULT_CATEGORY_IDS.other;
}

function detectCategory(text: string, language: string = "vi", categories?: Array<CategoryRow>): string {
  if (categories && categories.length > 0) {
    return detectCategoryByList(text, categories);
  }
  const { matchesKeyword } = buildKeywordMatcher(text);
  const categoryMap = categoryKeywordMap[language] || categoryKeywordMap.vi;
  for (const [keyword, category] of Object.entries(categoryMap)) {
    if (matchesKeyword(keyword)) {
      return category;
    }
  }
  return DEFAULT_CATEGORY_IDS.other;
}

function createFallbackId(): string {
  const cryptoObj = globalThis.crypto as { randomUUID?: () => string } | undefined;
  if (cryptoObj?.randomUUID) {
    return cryptoObj.randomUUID();
  }
  return `tx_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

// categories: Array<{ name: string; id: string; type: string }>
export function parseTransactionLocal(text: string, categories: Array<CategoryRow>, userLanguage?: string): Transaction {
  const language = userLanguage || detectLanguage(text);
  const type = detectType(text, language);
  const category = detectCategory(text, language, categories);
  const amount = parseAmount(text, language);
  return {
    id: createFallbackId(),
    type,
    category,
    amount,
    note: text,
    createdAt: new Date(),
  };
}

export function parseTransactionServer(text: string, categories: Array<CategoryRow>, userLanguage?: string): Transaction {
  const language = userLanguage || detectLanguage(text);
  const type = detectType(text, language);
  const category = detectCategory(text, language, categories);
  const amount = parseAmount(text, language);
  return {
    id: createFallbackId(),
    type,
    category,
    amount,
    note: text,
    createdAt: new Date(),
  };
}
