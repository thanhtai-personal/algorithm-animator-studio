"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

const SUPPORT_URL = "https://www.facebook.com/profile.php?id=61585671813640";

export function ProfileSupportCard() {
  const { t } = useI18n();

  return (
    <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: "260ms" }}>
      <CardHeader>
        <CardTitle className="text-lg">{t("profile.supportTitle")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("profile.supportSubtitle")}</p>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" className="w-full">
          <a href={SUPPORT_URL} target="_blank" rel="noreferrer">
            {t("profile.supportAction")}
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
