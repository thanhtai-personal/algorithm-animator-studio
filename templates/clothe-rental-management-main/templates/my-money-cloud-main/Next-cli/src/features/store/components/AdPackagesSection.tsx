import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, ShieldOff } from "lucide-react";
import { cn } from "@/utils";
import { storePageStore } from "../stores/storePageStore";
import { useI18n } from "@/lib/i18n";

export function AdPackagesSection({ formatPrice, handlePurchase, isOnline }: {
  formatPrice: (usdPrice: number) => string;
  handlePurchase: (id: string) => void;
  isOnline: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldOff className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">{t("store.removeAdsTitle")}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{t("store.removeAdsDesc")}</p>
      <div className="grid gap-4 md:grid-cols-3">
        {storePageStore.adPackages.map((pkg) => (
          <Card
            key={pkg.id}
            variant="elevated"
            className={cn(
              "relative overflow-hidden transition-all hover:shadow-lg",
              pkg.popular && "border-2 border-primary"
            )}
          >
            {pkg.popular && (
              <Badge className="absolute right-4 top-4 bg-primary text-primary-foreground">
                {t("store.popular")}
              </Badge>
            )}
            {pkg.save && (
              <Badge className="absolute left-4 top-4 bg-emerald-500 text-white">
                {t("store.save")} {pkg.save}
              </Badge>
            )}
            <CardHeader className="pb-4">
              <CardTitle className="text-base">{t(pkg.nameKey)}</CardTitle>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{formatPrice(pkg.price)}</span>
                <span className="text-sm text-muted-foreground">/{t(pkg.periodKey)}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>{t("store.adFeature1")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>{t("store.adFeature2")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>{t("store.adFeature3")}</span>
                </li>
              </ul>
              <Button
                className="w-full"
                variant={pkg.popular ? "default" : "outline"}
                onClick={() => handlePurchase(pkg.id)}
                disabled={storePageStore.processing === pkg.id || !isOnline}
              >
                {storePageStore.processing === pkg.id ? t("store.processing") : t("store.purchase")}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
