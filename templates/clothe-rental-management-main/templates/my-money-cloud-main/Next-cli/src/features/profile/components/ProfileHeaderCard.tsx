"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";

interface ProfileHeaderCardProps {
  email?: string | null;
  displayName?: string | null;
  isAnonymous?: boolean;
}

function getInitial(value?: string | null) {
  return value?.trim().charAt(0).toUpperCase() || "?";
}

export function ProfileHeaderCard({
  email,
  displayName,
  isAnonymous = false,
}: ProfileHeaderCardProps) {
  const { t } = useI18n();
  const displayEmail = isAnonymous ? t("profile.guest") : email || t("profile.noEmail");
  const displayNameText = displayName?.trim() || t("profile.notAvailable");

  return (
    <Card variant="elevated" className="animate-slide-up">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-primary flex items-center justify-center text-white text-xl font-bold">
            {getInitial(displayEmail)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-semibold truncate">{displayEmail}</p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 text-xs text-muted-foreground">
          <div>
            <span className="font-semibold text-foreground">{t("profile.displayName")}:</span>{" "}
            {displayNameText}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
