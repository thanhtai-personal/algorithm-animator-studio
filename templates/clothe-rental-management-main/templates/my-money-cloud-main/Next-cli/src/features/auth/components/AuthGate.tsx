"use client";

import { ReactNode } from "react";
import { observer } from "mobx-react-lite";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useI18n } from "@/lib/i18n";
import { useAuthRouting } from "../hooks/routing/useAuthRouting";

export const AuthGate = observer(function AuthGate({ children }
  : { isOnboardingPage?: boolean; children: ReactNode }) {

  const { t } = useI18n();

  const { isWaiting } = useAuthRouting();

  return isWaiting ? (
    <LoadingScreen message={t("auth.loading")} />
  ) : (
    <>{children}</>
  );
});
