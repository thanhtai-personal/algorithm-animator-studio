"use client";

import React, { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { Bot, CheckCircle2, ShoppingCart, Sparkles, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useI18n } from "@/lib/i18n";
import { convertUSD, formatPrice as formatPriceWithCurrency, getExchangeRates } from "@/lib/exchangeRate";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useOnlineChecker } from "@/hooks/useOnlineChecker";
import { useAnonymousChecker } from "@/hooks/useAnonymousChecker";

interface AIAssistantModalProps {
  open: boolean;
  onClose: () => void;
  onPurchase: (packageId: string, price: number) => void;
  hasUsedTrial: boolean;
}

interface AIPackage {
  id: string;
  name: string;
  requests: number;
  price: number;
  popular: boolean;
  save?: string;
  isTrial?: boolean;
}

const FREE_TRIAL_REQUESTS = parseInt(process.env.NEXT_PUBLIC_AI_FREE_TRIAL_REQUESTS ?? "50", 10);

const getAIPackages = (t: (key: string) => string): AIPackage[] => [
  {
    id: "ai-trial",
    name: t("aiModal.trialPack"),
    requests: FREE_TRIAL_REQUESTS,
    price: 0,
    popular: false,
    isTrial: true,
  },
  {
    id: "ai-250",
    name: t("aiModal.starterPack"),
    requests: 250,
    price: 1.0,
    popular: false,
  },
  {
    id: "ai-3000",
    name: t("aiModal.proPack"),
    requests: 3000,
    price: 10.0,
    popular: true,
    save: "17%",
  },
];

export const AIAssistantModal = observer(
  ({ open, onClose, onPurchase, hasUsedTrial }: AIAssistantModalProps) => {
    const { t, currency, localeCode } = useI18n();
    const { isOnline } = useOnlineChecker();
    const { isAnonymous } = useAnonymousChecker();
    const router = useRouter();
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
    const [isLoadingRates, setIsLoadingRates] = useState(true);

    const AI_PACKAGES = useMemo(() => getAIPackages(t), [t]);

    useEffect(() => {
      async function loadRates() {
        setIsLoadingRates(true);
        const rates = await getExchangeRates();
        setExchangeRates(rates);
        setIsLoadingRates(false);
      }
      void loadRates();
    }, []);

    const formatPrice = (usdAmount: number): string => {
      if (usdAmount === 0) {
        return t("common.free") || "Free";
      }
      if (currency === "USD") {
        return formatPriceWithCurrency(usdAmount, "USD", localeCode);
      }
      const convertedAmount = convertUSD(usdAmount, currency, exchangeRates);
      return formatPriceWithCurrency(convertedAmount, currency, localeCode);
    };

    const availablePackages = AI_PACKAGES.filter((pkg) => !pkg.isTrial || !hasUsedTrial);

    const handlePurchasePackage = (pkg: AIPackage) => {
      if (isAnonymous) {
        setShowLoginPrompt(true);
        return;
      }
      onPurchase(pkg.id, pkg.price);
      onClose();
    };

    return (
      <Drawer open={open} onOpenChange={onClose}>
        <DrawerContent>
          <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t("ai.loginPromptTitle") || t("auth.signIn")}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {t("ai.loginPromptDesc") || "Đăng nhập để mua gói AI và đồng bộ dữ liệu."}
                </p>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-3">
                <Button variant="outline" onClick={() => setShowLoginPrompt(false)}>
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={() => {
                    setShowLoginPrompt(false);
                    onClose();
                    router.push("/auth");
                  }}
                >
                  {t("auth.signIn") || "Đăng nhập"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <DrawerHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-6 h-6 text-primary" />
                <DrawerTitle className="text-xl font-bold">{t("aiModal.title")}</DrawerTitle>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon">
                  ✕
                </Button>
              </DrawerClose>
            </div>
            <DrawerDescription className="text-left mt-2">{t("aiModal.description")}</DrawerDescription>

            {!isOnline && (
              <div className="mt-3 rounded-lg bg-muted/80 px-3 py-2 text-sm text-muted-foreground">
                {t("common.offline") || "Offline - purchases unavailable"}
              </div>
            )}

            {isAnonymous && isOnline && (
              <div className="mt-3 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-2">
                <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                  ⚠️ {t("ai.anonymousWarning") || "Guest Mode: Purchases saved to device only"}
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                  {t("ai.anonymousWarningDesc") || "Sign in to backup and restore on other devices."}
                </p>
              </div>
            )}

          </DrawerHeader>

          <div className="px-4 pb-4 space-y-3 max-h-[60vh] overflow-y-auto">
            {availablePackages.map((pkg) => (
              <div key={pkg.id} className="relative rounded-xl border bg-card/80 p-4 space-y-4">
                {pkg.popular ? (
                  <div className="absolute -top-2 left-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {t("store.popular")}
                  </div>
                ) : null}
                {pkg.save ? (
                  <div className="absolute -top-2 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {t("store.save")} {pkg.save}
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-6">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      {pkg.isTrial ? (
                        <Sparkles className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      )}
                      <h3 className="text-lg font-bold leading-tight">
                        {pkg.requests} {t("store.requests")}
                      </h3>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-extrabold text-primary">
                        {isLoadingRates ? "..." : formatPrice(pkg.price)}
                      </div>
                      {pkg.price > 0 && !isLoadingRates ? (
                        <p className="text-xs text-muted-foreground">{t("aiModal.priceDisclaimer")}</p>
                      ) : null}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="gap-2 justify-start px-3 py-2 rounded-xl">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        {t("aiModal.feature1")}
                      </Badge>
                      <Badge variant="outline" className="gap-2 justify-start px-3 py-2 rounded-xl">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        {t("aiModal.feature2")}
                      </Badge>
                      <Badge variant="outline" className="gap-2 justify-start px-3 py-2 rounded-xl">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        {t("aiModal.feature3")}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-row items-center justify-between md:flex-col md:items-end md:justify-start gap-3">
                    <Button
                      className="gap-2 min-w-[160px] justify-center"
                      onClick={() => handlePurchasePackage(pkg)}
                      disabled={isLoadingRates || !isOnline || (pkg.isTrial && hasUsedTrial)}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {pkg.isTrial ? t("aiModal.startTrial") : t("store.purchase")}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DrawerFooter>
            <Button variant="outline" onClick={onClose} className="w-full">
              {t("common.close")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  },
);
