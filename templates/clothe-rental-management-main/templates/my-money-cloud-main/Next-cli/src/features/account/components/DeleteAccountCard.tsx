"use client";

import { useState } from "react";
import { getSupabaseAuthHeaders } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ConfirmLogoutDialog } from "@/features/auth/components/ConfirmLogoutDialog";
import { useAuthActions } from "@/features/auth/hooks/login/useAuthActions";
import { authStore } from "@/store/authStore";
import { offlineQueueStore } from "@/store/offlineQueueStore";
import { observer } from "mobx-react-lite";

const CONFIRM_TEXT = "DELETE";

export const DeleteAccountCard = observer(function DeleteAccountCard() {
  const { t } = useI18n();
  const { signOut } = useAuthActions();
  const user = authStore.userSettings;
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const isConfirmed = confirmText.trim().toUpperCase() === CONFIRM_TEXT;

  const performDelete = async () => {
    if (!isConfirmed || deleting) return;
    setDeleting(true);
    try {
      const authHeaders = await getSupabaseAuthHeaders();
      const response = await fetch("/api/auth/delete-account", {
        method: "DELETE",
        headers: authHeaders,
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        toast.error(data.error ?? t("toast.saveFailed"));
        return;
      }

      await signOut({ force: true });
      toast.success(t("account.deleteSuccess"));
      router.push("/");
    } catch {
      toast.error(t("toast.saveFailed"));
    } finally {
      setDeleting(false);
    }
  };

  const handleDelete = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isConfirmed || deleting) {
      return;
    }
    const pendingCount = authStore.userId ? offlineQueueStore.getCount(authStore.userId) : 0;
    if (pendingCount > 0) {
      setShowLogoutDialog(true);
      return;
    }
    await performDelete();
  };

  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-lg card-2d">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold">{t("account.deleteTitle")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("account.deleteSubtitle")}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-muted-foreground">
            <p className="font-semibold text-destructive">{t("account.deleteDescription")}</p>
          </div>
          {user?.email ? (
            <p className="text-xs text-muted-foreground">
              {t("auth.email")}: <span className="font-semibold">{user.email}</span>
            </p>
          ) : null}
          <form className="space-y-4" onSubmit={handleDelete} aria-busy={deleting}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="confirmDelete">
                {t("account.deleteConfirmLabel")}
              </label>
              <Input
                id="confirmDelete"
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                placeholder={t("account.deleteConfirmPlaceholder")}
                disabled={deleting}
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" variant="destructive" className="w-full" disabled={!isConfirmed || deleting}>
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("auth.loading")}
                  </>
                ) : (
                  t("account.deleteAction")
                )}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                disabled={deleting}
                onClick={() => router.back()}
              >
                {t("common.back")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <ConfirmLogoutDialog
        open={showLogoutDialog}
        onConfirm={() => {
          setShowLogoutDialog(false);
          void performDelete();
        }}
        onCancel={() => setShowLogoutDialog(false)}
      />
    </div>
  );
})
