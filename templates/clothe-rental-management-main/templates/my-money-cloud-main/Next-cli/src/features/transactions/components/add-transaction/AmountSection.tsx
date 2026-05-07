"use client";

import { useMemo, useState } from "react";
import { AmountKeypad } from "@/components/inputs/AmountKeypad";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { X } from "lucide-react";

type AmountSectionProps = {
  amount: string;
  localeCode: string;
  currencySymbol: string;
  currency: string;
  onAmountChange: (value: string) => void;
  onQuickSelect: (value: string) => void;
  label: string;
  autoFocus?: boolean;
};

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

export function AmountSection({
  amount,
  localeCode,
  currencySymbol,
  currency,
  onAmountChange,
  onQuickSelect,
  label,
  autoFocus = true,
}: AmountSectionProps) {
  const isVnd = (currency ?? "").toUpperCase() === "VND";
  const [keypadOpen, setKeypadOpen] = useState(false);
  const formattedAmount = useMemo(
    () => (amount ? parseInt(amount, 10).toLocaleString(localeCode) : ""),
    [amount, localeCode],
  );

  return (
    <div className="animate-slide-up">
      <div className="text-center mb-8">
        <p className="text-muted-foreground text-sm mb-2">{label}</p>
        <div className="relative flex items-center justify-center">
          <input
            type="text"
            inputMode={isVnd ? "none" : "numeric"}
            value={formattedAmount}
            onChange={(event) => onAmountChange(event.target.value)}
            placeholder="0"
            className="w-full text-center text-4xl font-extrabold bg-transparent rounded-2xl border border-muted outline-none focus:ring-2 focus:ring-primary/40 pr-6"
            autoFocus={autoFocus}
            readOnly={isVnd}
            onFocus={() => {
              if (isVnd) setKeypadOpen(true);
            }}
          />
          <span className="absolute right-3 text-2xl font-bold text-muted-foreground">{currencySymbol}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        {QUICK_AMOUNTS.map((value) => (
          <Button
            key={value}
            type="button"
            variant="secondary"
            onClick={() => onQuickSelect(value.toString())}
            className="py-2.5 px-3 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
          >
            {(value / 1000).toLocaleString(localeCode)}k
          </Button>
        ))}
      </div>

      {isVnd ? (
        <Drawer open={keypadOpen} onOpenChange={setKeypadOpen}>
          <DrawerContent className="p-0 rounded-t-3xl bg-background overflow-hidden max-h-[70vh]">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <DrawerTitle className="text-lg font-bold">{label}</DrawerTitle>
              <DrawerClose asChild>
                <button className="rounded-full border border-border/60 p-2 text-muted-foreground transition hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </DrawerClose>
            </div>
            <div className="px-5 pb-6 space-y-4">
              <div className="text-center text-3xl font-extrabold">{formattedAmount || "0"}</div>
              <AmountKeypad value={amount} onChange={onAmountChange} currency={currency} />
              <div className="flex justify-end">
                <Button type="button" onClick={() => setKeypadOpen(false)} className="px-6">
                  Done
                </Button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      ) : null}
    </div>
  );
}
