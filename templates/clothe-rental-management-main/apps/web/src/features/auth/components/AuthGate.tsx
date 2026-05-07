"use client";

import { ReactNode } from "react";
import { observer } from "mobx-react-lite";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useI18n } from "@/lib/i18n";
import { useAuthRouting } from "../hooks/routing/useAuthRouting";

export const AuthGate = observer(function AuthGate({ children }
  : { children: ReactNode }) {
  const { t } = useI18n();
  const { isWaiting } = useAuthRouting();

  if (isWaiting) {
    return <LoadingScreen message={t("auth.loading")} />;
  }

  return <>{children}</>;
});
