import { storePageStore } from "../stores/storePageStore";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "next/navigation";

export function LoginPromptDialog() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <Dialog open={storePageStore.showLoginPrompt} onOpenChange={storePageStore.setShowLoginPrompt.bind(storePageStore)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("store.loginPromptTitle") || "Yêu cầu đăng nhập"}</DialogTitle>
          <div className="text-muted-foreground text-sm">{t("store.loginPromptDesc") || "Vui lòng đăng nhập để thực hiện thao tác này."}</div>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-3">
          <Button variant="outline" onClick={() => storePageStore.setShowLoginPrompt(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => {
              storePageStore.setShowLoginPrompt(false);
              router.push("/auth");
            }}
          >
            {t("auth.signIn") || "Đăng nhập"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
