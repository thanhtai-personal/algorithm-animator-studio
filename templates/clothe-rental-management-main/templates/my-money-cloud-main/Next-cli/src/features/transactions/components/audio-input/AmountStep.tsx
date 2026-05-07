"use client";

import { Mic } from "lucide-react";
import { AmountKeypad } from "@/components/inputs/AmountKeypad";
import { cn } from "@/utils";
import { useI18n } from "@/lib/i18n";
import { getCurrencySymbol } from "@/lib/currency";
import { useVoiceDictation } from "@/lib/voice/useVoiceDictation";
import { extractAmountFromTranscript } from "@/lib/voice/voiceUtils";
import { toast as notify } from "sonner";
import { useEffect, useRef } from "react";

type TransactionType = "income" | "expense";

type AmountStepProps = {
  amount: string;
  transactionType: TransactionType;
  onTransactionTypeChange: (type: TransactionType) => void;
  onAmountChange: (value: string) => void;
  onQuickSelect: (value: number) => void;
};

const QUICK_AMOUNTS = [50000, 100000, 200000];

export function AmountStep({
  amount,
  transactionType,
  onTransactionTypeChange,
  onAmountChange,
  onQuickSelect,
}: AmountStepProps) {
  const { t, localeCode, currency, audioLanguage } = useI18n();
  const currencySymbol = getCurrencySymbol(currency, localeCode);

  const { isListening: micOn, listeningField, startListening, stopListening } = useVoiceDictation({
    audioLanguage,
    onResult: (_, transcript) => {
      const parsed = extractAmountFromTranscript(transcript, audioLanguage);
      if (parsed && parsed > 0) {
        onAmountChange(parsed.toString());
        notify.success(t("toast.voiceCaptured"));
      } else {
        notify.error(t("toast.voiceNoAmount"));
      }
    },
    toast: (msg, variant) => {
      if (variant === "error") notify.error(msg);
      else notify(msg);
    },
    messages: {
      unsupported: t("toast.voiceUnsupported"),
      ready: t("toast.voiceReady"),
    },
  });

  const hasAutoStartedRef = useRef(false);

  useEffect(() => {
    if (hasAutoStartedRef.current) return;
    hasAutoStartedRef.current = true;
    startListening("amount");
  }, [startListening]);

  useEffect(() => () => stopListening(), [stopListening]);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <div className="flex gap-2 p-1 bg-muted rounded-xl">
        {(["expense", "income"] as const).map((type) => (
          <button
            key={type}
            onClick={() => onTransactionTypeChange(type)}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-semibold transition-all",
              transactionType === type
                ? type === "expense"
                  ? "bg-red-500 text-white shadow"
                  : "bg-green-500 text-white shadow"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(type === "expense" ? "common.expense" : "common.income")}
          </button>
        ))}
      </div>

      <div className="text-center">
        <p className="text-xs font-medium text-muted-foreground mb-3">{t("common.amount")}</p>
        <div className="relative flex items-center justify-center">
          <input
            type="text"
            inputMode="none"
            value={amount ? parseInt(amount).toLocaleString(localeCode) : ""}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="0"
            autoFocus
            readOnly
            className="w-full text-center text-5xl font-extrabold bg-transparent outline-none"
          />
          <span className="absolute right-0 text-3xl font-bold text-muted-foreground">{currencySymbol}</span>
        </div>
      </div>

      <button
        onClick={() => startListening("amount")}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-3 rounded-xl",
          "bg-primary text-white font-semibold transition-all",
          "hover:bg-primary/90 active:scale-95",
          micOn && listeningField === "amount" ? "animate-pulse" : "disabled:opacity-50 disabled:cursor-not-allowed",
        )}
      >
        <Mic className="h-5 w-5" />
        {micOn && listeningField === "amount" ? t("common.stop") || "Dừng" : t("addTransaction.voiceInput")}
      </button>

      <div className="grid grid-cols-3 gap-2">
        {QUICK_AMOUNTS.map((value) => (
          <button
            key={value}
            onClick={() => onQuickSelect(value)}
            className="py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium transition-all active:scale-95"
          >
            {(value / 1000).toLocaleString(localeCode)}k
          </button>
        ))}
      </div>

      <AmountKeypad value={amount} onChange={onAmountChange} currency={currency} />
    </div>
  );
}
