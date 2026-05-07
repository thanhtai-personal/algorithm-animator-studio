"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { useAuthActions } from "../hooks/login/useAuthActions";

export function AccountSwitchPrompt() {
  const { t } = useI18n();
  const {
    accountSwitchPending,
    cancelAccountSwitch,
    confirmAccountSwitchErase,
    confirmAccountSwitchSync,
  } = useAuthActions();
  const [processing, setProcessing] = useState(false);

  const handleCancel = async () => {
    if (processing) return;
    setProcessing(true);
    await cancelAccountSwitch();
    setProcessing(false);
  };

  const handleErase = async () => {
    if (processing) return;
    setProcessing(true);
    await confirmAccountSwitchErase();
    setProcessing(false);
  };

  const handleSync = async () => {
    if (processing) return;
    setProcessing(true);
    const success = await confirmAccountSwitchSync();
    if (!success) {
      setProcessing(false);
      return;
    }
    setProcessing(false);
  };

  return (
    <Dialog open={accountSwitchPending} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader className="text-center">
          <DialogTitle>{t("auth.switchAccountTitle")}</DialogTitle>
          <DialogDescription>{t("auth.switchAccountDescription")}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-3">
          <Button
            variant="ghost"
            onClick={handleCancel}
            disabled={processing}
            className="w-full whitespace-normal text-center bg-muted text-foreground hover:bg-muted/80"
          >
            {t("auth.switchAccountCancel")}
          </Button>
          <Button
            variant="secondary"
            onClick={handleErase}
            disabled={processing}
            className="w-full whitespace-normal text-center"
          >
            {t("auth.switchAccountErase")}
          </Button>
          <Button
            onClick={handleSync}
            disabled={processing}
            className="w-full whitespace-normal text-center"
          >
            {t("auth.switchAccountSync")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
