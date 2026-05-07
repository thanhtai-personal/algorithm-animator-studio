import type React from "react";
import { AmountKeypad } from "@/components/inputs/AmountKeypad";
import { VoiceTransactionVoiceButton } from "./VoiceTransactionVoiceButton";

interface AmountStepProps {
  amount: string;
  currency: string;
  currencySymbol: string;
  localeCode: string;
  isListening: boolean;
  onVoiceStart: () => void;
  onVoiceStop: () => void;
  onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAmountValueChange: (value: string) => void;
  onQuickSelect: (value: number) => void;
  t: (key: string) => string | undefined;
}

export function VoiceTransactionAmountStep({
  amount,
  currency,
  currencySymbol,
  localeCode,
  isListening,
  onVoiceStart,
  onVoiceStop,
  onAmountChange,
  onAmountValueChange,
  onQuickSelect,
  t,
}: AmountStepProps) {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <VoiceTransactionVoiceButton
        isListening={isListening}
        onPress={onVoiceStart}
        onRelease={onVoiceStop}
        label={t("addTransaction.listening")}
        idleLabel={t("addTransaction.tapToSpeak")}
      />

      <div className="text-center">
        <p className="text-xs font-medium text-muted-foreground mb-3">{t("common.amount")}</p>
        <div className="relative flex items-center justify-center">
          <input
            type="text"
            inputMode="none"
            value={amount ? parseInt(amount, 10).toLocaleString(localeCode) : ""}
            onChange={onAmountChange}
            placeholder="0"
            disabled={isListening}
            readOnly
            className="w-full text-center text-5xl font-extrabold bg-transparent outline-none disabled:opacity-50"
          />
          <span className="absolute right-0 text-3xl font-bold text-muted-foreground">{currencySymbol}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[50000, 100000, 200000, 500000].map((value) => (
          <button
            key={value}
            onClick={() => onQuickSelect(value)}
            className="py-3 rounded-xl bg-muted hover:bg-muted/80 text-sm font-medium transition-all active:scale-95"
          >
            {(value / 1000).toLocaleString(localeCode)}k
          </button>
        ))}
      </div>

      <AmountKeypad value={amount} onChange={onAmountValueChange} currency={currency} disabled={isListening} />
    </div>
  );
}
