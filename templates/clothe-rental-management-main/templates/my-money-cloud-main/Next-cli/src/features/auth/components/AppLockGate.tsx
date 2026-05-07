"use client";

import { type ReactNode } from "react";
import { observer } from "mobx-react-lite";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { appLockStore } from "@/features/auth/stores/AppLockStore";
import { useAppLockGate } from "@/features/auth/hooks/login/useAppLockGate";

const AppLockGateContent = observer(() => {
  const {
    t,
    PIN_LENGTH,
    shouldLock,
    error,
    attempting,
    inputRefs,
    handleDigitChange,
    handleDigitKeyDown,
    handleUnlock,
    handleUsePassword,
  } = useAppLockGate();

  if (!shouldLock) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">{t("auth.lockTitle")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("auth.lockSubtitlePin")}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("auth.lockPin")}</label>
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: PIN_LENGTH }).map((_, index) => (
                <Input
                  key={`pin-${index}`}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  type="password"
                  name={`lock-pin-${index}`}
                  inputMode="numeric"
                  maxLength={1}
                  value={appLockStore.pinDigits[index]}
                  onChange={(event) => handleDigitChange(index, event.target.value)}
                  onKeyDown={(event) => handleDigitKeyDown(index, event)}
                  disabled={attempting}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  autoCapitalize="off"
                  className="h-12 w-10 text-center text-lg font-semibold"
                />
              ))}
            </div>
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </div>
          <Button className="w-full" onClick={() => void handleUnlock()} disabled={attempting}>
            {t("auth.lockUnlock")}
          </Button>
          <Button variant="outline" className="w-full" onClick={handleUsePassword}>
            {t("auth.signOut")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
});

AppLockGateContent.displayName = "AppLockGateContent";

export const AppLockGate = observer(function AppLockGate({ children }: { children: ReactNode }) {
  return appLockStore.locked ? <AppLockGateContent /> : children;
});
