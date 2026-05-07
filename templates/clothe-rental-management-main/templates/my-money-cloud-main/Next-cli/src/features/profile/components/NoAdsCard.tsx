"use client";

import { useMemo, useState } from "react";
import { Check, Sparkles, X } from "lucide-react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent } from "@/components/ui/drawer";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/utils";

export function NoAdsCard() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "lifetime">("monthly");
  const monthlyPrice = "$1";
  const lifetimePrice = "$10";

  const features = useMemo(
    () => [
      t("iap.featureTrack"),
      t("iap.featureUnlimited"),
      t("iap.featureInsights"),
      t("iap.featureCommunity"),
      t("iap.featureAchievements"),
    ],
    [t]
  );

  return (
    <>
      <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: "200ms" }}>
        <CardHeader>
          <CardTitle className="text-lg">{t("iap.noAdsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("iap.noAdsSubtitle")}</p>
          <Button className="w-full" onClick={() => setOpen(true)}>
            {t("iap.noAdsAction")}
          </Button>
        </CardContent>
      </Card>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="w-full max-h-[80vh] p-0 overflow-hidden rounded-t-3xl flex flex-col bg-gradient-to-b from-card/95 via-background/95 to-card/90">
          <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
            <span className="text-sm font-semibold">{t("iap.noAdsTitle")}</span>
            <DrawerClose asChild>
              <button className="rounded-full border border-border/60 p-2 text-muted-foreground transition hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </DrawerClose>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-5 pt-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full shadow-glow">
                <Image
                  src="/AI-avt.png"
                  alt="AI Assistant"
                  width={80}
                  height={80}
                  className="rounded-full"
                  loading="eager"
                />
              </div>
              <h3 className="text-lg font-semibold">{t("iap.modalHeadline")}</h3>
              <p className="text-xs text-muted-foreground">{t("iap.modalSubtitle")}</p>
              <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-4 w-4" />
                {t("iap.modalTrial")}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => setSelectedPlan("monthly")}
                aria-pressed={selectedPlan === "monthly"}
                className={cn(
                  "relative w-full rounded-2xl border px-4 py-3 text-left transition",
                  selectedPlan === "monthly"
                    ? "border-primary shadow-glow"
                    : "border-border/60 hover:border-primary/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{t("iap.planMonthly")}</span>
                  {selectedPlan === "monthly" ? (
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-4 w-4" />
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("iap.monthlyLabel", { price: monthlyPrice })}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlan("lifetime")}
                aria-pressed={selectedPlan === "lifetime"}
                className={cn(
                  "relative w-full rounded-2xl border px-4 py-3 text-left transition",
                  selectedPlan === "lifetime"
                    ? "border-primary shadow-glow"
                    : "border-border/60 hover:border-primary/50"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{t("iap.planLifetime")}</span>
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                    {t("iap.planPopular")}
                  </span>
                  {selectedPlan === "lifetime" ? (
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-4 w-4" />
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("iap.lifetimeLabel", { price: lifetimePrice })}
                </p>
              </button>
            </div>

            <div className="mt-4 space-y-2 rounded-2xl border border-border/40 bg-muted/40 p-3">
              <p className="text-sm font-semibold">{t("iap.featuresTitle")}</p>
              <div className="grid gap-2 text-sm">
                {features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-primary">
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="text-xs text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button className="mt-4 w-full" type="button" onClick={() => setOpen(false)}>
              {t("iap.noAdsAction")}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
