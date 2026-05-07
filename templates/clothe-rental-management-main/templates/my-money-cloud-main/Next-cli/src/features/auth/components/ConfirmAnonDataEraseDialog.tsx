import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

interface ConfirmAnonDataEraseDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmAnonDataEraseDialog({ open, onConfirm, onCancel }: ConfirmAnonDataEraseDialogProps) {
  const { t } = useI18n();
  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogTitle>{t("auth.anonEraseTitle")}</DialogTitle>
        <p>{t("auth.anonEraseDesc")}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
          <Button variant="destructive" onClick={onConfirm}>{t("auth.anonEraseConfirm")}</Button>
          <Button variant="outline" onClick={onCancel}>{t("auth.anonEraseCancel")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
