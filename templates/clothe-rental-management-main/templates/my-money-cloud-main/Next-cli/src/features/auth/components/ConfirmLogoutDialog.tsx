import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

interface ConfirmLogoutDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmLogoutDialog({ open, onConfirm, onCancel }: ConfirmLogoutDialogProps) {
  const { t } = useI18n();
  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogTitle>{t("auth.logoutConfirmTitle")}</DialogTitle>
        <p>{t("auth.logoutConfirmDesc")}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
          <Button variant="destructive" onClick={onConfirm}>{t("auth.logoutConfirm")}</Button>
          <Button variant="outline" onClick={onCancel}>{t("auth.logoutCancel")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
