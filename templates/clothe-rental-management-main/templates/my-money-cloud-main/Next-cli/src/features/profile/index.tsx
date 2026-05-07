"use client";

import { useI18n } from "@/lib/i18n";
import { ProfileHeaderCard } from "@/features/profile/components/ProfileHeaderCard";
import { ProfilePreferencesCard } from "@/features/profile/components/ProfilePreferencesCard";
import { ProfileSupportCard } from "@/features/profile/components/ProfileSupportCard";
import { DataResyncCard } from "@/features/profile/components/DataResyncCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuthActions } from "../auth/hooks/login/useAuthActions";
import { authStore } from "@/store/authStore";
import { useAnonymousChecker } from "@/hooks/useAnonymousChecker";
import { ConfirmLogoutDialog } from "@/features/auth/components/ConfirmLogoutDialog";
import { offlineQueueStore } from "@/store/offlineQueueStore";
import { useState } from "react";
import { observer } from "mobx-react-lite";
import { settingsUpdateStore } from "@/store/settingsUpdateStore";

interface ProfilePageProps {
  loading?: boolean;
}

export const ProfilePage = observer(function ProfilePage({ loading = false }: ProfilePageProps) {
  const user = authStore.userSettings;
  const { isAnonymous } = useAnonymousChecker();
  const { signOut, exitAnonymous } = useAuthActions();
  const { t } = useI18n();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const displayName = user?.displayName || t("profile.anonymousUser");
  const loadingLabel = t("common.loading");
  const handleSignOut = async () => {
    const pendingCount = authStore.userId ? offlineQueueStore.getCount(authStore.userId) : 0;
    if (pendingCount > 0) {
      setShowLogoutDialog(true);
      return;
    }
    await signOut();
  };

  return (
    <div className="space-y-6 pb-32 relative">
      {settingsUpdateStore.updating ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : null}
      <div className="space-y-1">
        <h2 className="text-xl font-bold">{t("profile.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("profile.subtitle")}</p>
      </div>

      {loading ? (
        <HeaderLoading label={loadingLabel} />
      ) : (
        <ProfileHeaderCard
          email={user?.email}
          displayName={displayName}
          isAnonymous={isAnonymous}
        />
      )}

      <ProfilePreferencesCard />

      <DataResyncCard />

      <ProfileSupportCard />

      <Card variant="elevated">
        <CardContent className="p-5 space-y-3">
          <h3 className="text-sm font-semibold">
            {isAnonymous ? t("profile.signIn") : t("profile.signOut")}
          </h3>
          {!isAnonymous ? (
            <p className="text-xs text-muted-foreground">
              {t("auth.logoutConfirmDesc")}
            </p>
          ) : null}
          <Button
            variant={isAnonymous ? "secondary" : "destructive"}
            onClick={isAnonymous ? exitAnonymous : handleSignOut}
          >
            {isAnonymous ? t("profile.signIn") : t("profile.signOut")}
          </Button>
        </CardContent>
      </Card>
      <ConfirmLogoutDialog
        open={showLogoutDialog}
        onConfirm={() => {
          setShowLogoutDialog(false);
          void signOut({ force: true });
        }}
        onCancel={() => setShowLogoutDialog(false)}
      />
    </div>
  );
})

function HeaderLoading({ label }: { label: string }) {
  return (
    <Card variant="elevated">
      <CardContent className="p-5">
        <div className="flex min-h-[140px] flex-col items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-xs">{label}</span>
        </div>
      </CardContent>
    </Card>
  );
}
