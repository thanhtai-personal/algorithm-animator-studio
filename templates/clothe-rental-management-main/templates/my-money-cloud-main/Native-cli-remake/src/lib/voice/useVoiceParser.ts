import { useCallback } from "react";
import { useI18n } from "@/lib/i18n";
import { useOnlineChecker } from "@/hooks/useOnlineChecker";
import { apiFetch } from "@/lib/api";
import { getSupabaseAuthHeaders } from "@/lib/supabase/client";
import { parseTransactionLocal } from "@/lib/voice/transactionParser";
import { DEFAULT_CATEGORY_IDS } from "@/features/categories/constants";
import { categoryStore } from "@/store/categoryStore";
import { useAnonymousChecker } from "@/hooks/useAnonymousChecker";
import { CategoryRow } from "@/features/categories/types";

type ParsedVoiceTransaction = {
  amount: number;
  note: string;
  type: "income" | "expense";
  categoryId: string;
  category: CategoryRow;
};

const CATEGORY_ID_MAP: Record<string, string> = {
  salary: DEFAULT_CATEGORY_IDS.salary,
  bonus: DEFAULT_CATEGORY_IDS.bonus,
  investment: DEFAULT_CATEGORY_IDS.investment,
  gift_received: DEFAULT_CATEGORY_IDS.bonus,
  other_income: DEFAULT_CATEGORY_IDS.otherIncome,
  food: DEFAULT_CATEGORY_IDS.food,
  transport: DEFAULT_CATEGORY_IDS.transport,
  shopping: DEFAULT_CATEGORY_IDS.shopping,
  entertainment: DEFAULT_CATEGORY_IDS.entertainment,
  health: DEFAULT_CATEGORY_IDS.health,
  education: DEFAULT_CATEGORY_IDS.education,
  bills: DEFAULT_CATEGORY_IDS.bills,
  gift_given: DEFAULT_CATEGORY_IDS.other,
  other_expense: DEFAULT_CATEGORY_IDS.other,
};

function resolveCategoryId(raw: string) {
  if (categoryStore.categoryMap[raw]) return raw;
  if (CATEGORY_ID_MAP[raw]) return CATEGORY_ID_MAP[raw];
  return DEFAULT_CATEGORY_IDS.other;
}

export function useVoiceParser() {
  const { localeCode } = useI18n();
  const { isOnline } = useOnlineChecker();
  const { isAnonymous } = useAnonymousChecker();

  const resolveLanguage = (value?: string | null) => {
    if (!value) return "vi";
    return value.includes("-") ? value.split("-")[0] : value;
  };

  const parseLocal = useCallback(
    (transcript: string): ParsedVoiceTransaction => {
      const language = resolveLanguage(localeCode);
      const localParsed = parseTransactionLocal(transcript, categoryStore.categories as any, language);
      return {
        amount: localParsed.amount ?? 0,
        note: localParsed.note ?? transcript,
        type: localParsed.type ?? "expense",
        categoryId: resolveCategoryId(localParsed.category),
        category: categoryStore.categoryMap[resolveCategoryId(localParsed.category)],
      };
    },
    [localeCode]
  );

  const parseVoice = useCallback(
    async (transcript: string): Promise<ParsedVoiceTransaction> => {
      const localParsed = parseLocal(transcript);
      if (!isOnline || isAnonymous) {
        return localParsed;
      }

      try {
        const authHeaders = await getSupabaseAuthHeaders();
        const res = await apiFetch("/api/ai/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ transcript, language: resolveLanguage(localeCode) }),
        });

        if (!res.ok) {
          let errorBody = "";
          try {
            errorBody = await res.text();
          } catch {
            errorBody = "";
          }
          return localParsed;
        }

        const data = await res.json();

        return {
          amount: data.amount ?? 0,
          note: data.note ?? data.description ?? transcript,
          type: data.type ?? "expense",
          categoryId: resolveCategoryId(data.category ?? localParsed.category),
          category: categoryStore.categoryMap[resolveCategoryId(data.category ?? localParsed.category)],
        };
      } catch (error) {
        return localParsed;
      }
    },
    [isOnline, isAnonymous, localeCode, parseLocal]
  );

  return {
    parseVoice,
  };
}
