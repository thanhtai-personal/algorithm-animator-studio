import { useCallback } from "react";
import { useAIVoiceSettings } from "@/hooks/useAIVoiceSettings";
import { useI18n } from "@/lib/i18n";
import { useOnlineChecker } from "@/hooks/useOnlineChecker";
import { parseTransactionLocal } from "@/lib/voice/transactionParser";
import { normalizeVoiceLanguage } from "@/lib/voice/voiceUtils";
import { categoryStore } from "@/store/categoryStore";
import { authStore } from "@/store/authStore";

interface ParsedVoiceTransaction {
  amount: number;
  note: string;
  type: "income" | "expense";
  category: string;
}

/**
 * Hook to parse voice transcript via API
 * Server handles: validation, local parser, AI fallback, request decrement
 */
export function useVoiceParser() {
  const { useAI } = useAIVoiceSettings();
  const { localeCode } = useI18n();
  const { isOnline } = useOnlineChecker();
  const isAIModeOn = useAI && isOnline;

  const parseLocal = useCallback(
    (transcript: string): ParsedVoiceTransaction => {
      const categories = Array.isArray(categoryStore.categories) ? categoryStore.categories : [];
      const parsed = parseTransactionLocal(transcript, categories as any, localeCode);
      return {
        amount: parsed.amount,
        note: parsed.note ?? transcript,

        type: parsed.type ?? "expense",
        category: parsed.category ?? "",
      };
    },
    [localeCode]
  );

  /**
   * Parse voice transcript via API
   * Server will try local parser first, then AI if needed
   * Server also handles request decrement
   */
  const parseVoice = useCallback(
    async (transcript: string): Promise<ParsedVoiceTransaction> => {
      const localParsed = parseLocal(transcript);

      if (!isAIModeOn || !authStore.userId) {
        return localParsed;
      }

      try {

        const res = await fetch("/api/ai/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript, language: localeCode }),
        });


        if (!res.ok) {
          return {
            amount: 0,
            note: transcript,
            type: "expense",
            category: "",
          };
        }

        const data = await res.json();

        const parsed = {
          amount: data.amount ?? 0,
          note: data.note ?? data.description ?? "",
          type: data.type ?? "expense",
          category: data.categoryId ?? data.category ?? "",
        };

        return parsed.amount > 0 ? parsed : localParsed;
      } catch (error) {
        return localParsed;
      }
    },
    [isAIModeOn, localeCode, parseLocal]
  );

  return {
    parseVoice,
    isAIModeOn,
  };
}
