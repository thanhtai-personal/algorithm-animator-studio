import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { PinInput } from "@/components/PinInput";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { THEME_VARIANTS } from "@/lib/themeVariants";
import { cn } from "@/utils";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { useUserSetting } from "../hooks/useUserSetting";
import { useI18n } from "@/lib/i18n";
import { useOnlineChecker } from "@/hooks/useOnlineChecker";

export function ProfilePreferencesCard() {
  const { t } = useI18n();
  const {
    variant,
    setVariant,
    isAIModeOn,
    ignoreVoiceVerify,
    useAI,
    setUseAI,
    setIgnoreVerify,
    lockEnabled,
    lockVisible,
    pinCode,
    setPinCode,
    pinConfirm,
    setPinConfirm,
    pinError,
    setPinError,
    lockUpdating,
    handleSavePin,
    handleToggleLock,
    handleDisableLock,
  } = useUserSetting();

  const { isOnline } = useOnlineChecker();
  const pinLength = pinCode.length;
  const [disableDrawerOpen, setDisableDrawerOpen] = useState(false);
  const [disablePin, setDisablePin] = useState<string[]>(Array(pinLength).fill(""));
  const [disablePinError, setDisablePinError] = useState<string | null>(null);

  const openDisableDrawer = () => {
    if (!lockEnabled) return;
    setDisablePin(Array(pinLength).fill(""));
    setDisablePinError(null);
    setDisableDrawerOpen(true);
  };

  const handleDisableDrawerChange = (open: boolean) => {
    setDisableDrawerOpen(open);
    if (!open) {
      setDisablePin(Array(pinLength).fill(""));
      setDisablePinError(null);
    }
  };

  const handleConfirmDisable = async () => {
    if (lockUpdating) return;
    const trimmedPin = disablePin.join("").trim();
    if (trimmedPin.length !== pinLength) {
      setDisablePinError(t("auth.lockPinLength"));
      return;
    }
    setDisablePinError(null);
    const ok = await handleDisableLock(trimmedPin);
    if (ok) {
      setDisableDrawerOpen(false);
      setDisablePin(Array(pinLength).fill(""));
    } else {
      setDisablePinError(t("auth.lockPinInvalid"));
    }
  };

  return (
    <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: "160ms" }}>
      <CardHeader>
        <CardTitle className="text-lg">{t("profile.preferences")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between rounded-2xl bg-muted/50 px-3 py-2">
          <div>
            <p className="text-sm font-semibold">{t("profile.language")}</p>
            <p className="text-xs text-muted-foreground">{t("actions.toggleLanguage")}</p>
          </div>
          <LanguageToggle />
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-muted/50 px-3 py-2">
          <div>
            <p className="text-sm font-semibold">{t("profile.screenLock")}</p>
            <p className="text-xs text-muted-foreground">{t("profile.screenLockHint")}</p>
          </div>
          <Switch
            checked={lockVisible}
            onCheckedChange={(checked) => {
              if (!checked) {
                if (!lockEnabled) {
                  handleToggleLock(false);
                  return;
                }
                openDisableDrawer();
                return;
              }
              handleToggleLock(true);
            }}
          />
        </div>
        {lockVisible ? (
          <div className="rounded-2xl bg-muted/50 px-3 py-3 space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="lockPin">
                {t("auth.lockPin")}
              </label>
              <PinInput
                value={pinCode}
                onChange={(newPin) => {
                  if (pinError) setPinError(null);
                  setPinCode(newPin);
                }}
                error={pinError ?? undefined}
                length={pinLength}
                disabled={lockUpdating}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="lockPinConfirm">
                {t("auth.lockPinConfirm")}
              </label>
              <PinInput
                value={pinConfirm}
                onChange={(newPin) => {
                  if (pinError) setPinError(null);
                  setPinConfirm(newPin);
                }}
                error={undefined}
                length={pinLength}
                disabled={lockUpdating}
                autoFocus={false}
              />
            </div>
            {pinError ? <p className="text-xs text-destructive">{pinError}</p> : null}
            <Button className="w-full" onClick={handleSavePin} disabled={lockUpdating}>
              {lockUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("auth.loading")}
                </>
              ) : (
                t("auth.lockSavePin")
              )}
            </Button>
            {lockEnabled ? (
              <Button variant="outline" className="w-full" onClick={openDisableDrawer}>
                {t("auth.lockDisable")}
              </Button>
            ) : null}
          </div>
        ) : null}
        <Drawer open={disableDrawerOpen} onOpenChange={handleDisableDrawerChange}>
          <DrawerContent className="w-full max-h-[80vh] p-0 overflow-hidden rounded-t-3xl flex flex-col bg-gradient-to-b from-card/95 via-background/95 to-card/90">
            <DrawerHeader className="text-left px-6 pt-6">
              <DrawerTitle>{t("auth.lockDisable")}</DrawerTitle>
              <DrawerDescription>{t("auth.lockSubtitlePin")}</DrawerDescription>
            </DrawerHeader>
            <div className="px-6 pb-6 space-y-4">
              <PinInput
                value={disablePin}
                onChange={(nextPin) => {
                  if (disablePinError) setDisablePinError(null);
                  setDisablePin(nextPin);
                }}
                error={disablePinError ?? undefined}
                length={pinLength}
                disabled={lockUpdating}
                autoFocus
              />
            </div>
            <DrawerFooter className="px-6 pb-6 pt-0">
              <Button className="w-full" onClick={handleConfirmDisable} disabled={lockUpdating}>
                {lockUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("auth.loading")}
                  </>
                ) : (
                  t("auth.lockDisable")
                )}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" className="w-full" disabled={lockUpdating}>
                  {t("common.cancel")}
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
        <Separator />
        <div className="flex items-center justify-between rounded-2xl bg-muted/50 px-3 py-2">
          <div>
            <p className="text-sm font-semibold">{t("profile.useAI")}</p>
            <p className="text-xs text-muted-foreground">{t("profile.useAIHint")}</p>
          </div>
          <Switch
            checked={useAI}
            onCheckedChange={async (checked) => {
              if (!isOnline) {
                toast.warning(t("common.offline"));
                return;
              }
              await setUseAI(checked);
              toast.success(
                checked
                  ? t("profile.useAI") + " - " + t("common.enabled")
                  : t("profile.useAI") + " - " + t("common.disabled")
              );
            }}
            disabled={!isOnline}
          />
        </div>
        {/* AI settings only when AI mode is active */}
        {isAIModeOn && (
          <>
            <Separator />
            <div className="flex items-center justify-between rounded-2xl bg-muted/50 px-3 py-2">
              <div>
                <p className="text-sm font-semibold">{t("profile.aiVoiceSettings")}</p>
                <p className="text-xs text-muted-foreground">{t("profile.autoCreateTransactionHint")}</p>
              </div>
              <Switch
                checked={ignoreVoiceVerify}
                onCheckedChange={async (checked) => {
                  if (!isOnline) {
                    toast.warning(t("common.offline"));
                    return;
                  }
                  await setIgnoreVerify(checked);
                  toast.success(
                    checked
                      ? t("profile.autoCreateTransaction") + " - " + t("common.enabled")
                      : t("profile.autoCreateTransaction") + " - " + t("common.disabled")
                  );
                }}
                disabled={!isOnline}
              />
            </div>
            <Separator />
          </>
        )}
        <div className="flex items-center justify-between rounded-2xl bg-muted/50 px-3 py-2">
          <div>
            <p className="text-sm font-semibold">{t("profile.theme")}</p>
            <p className="text-xs text-muted-foreground">{t("actions.toggleTheme")}</p>
          </div>
          <ThemeToggle />
        </div>
        <div className="rounded-2xl bg-muted/50 px-3 py-3 space-y-3">
          <div>
            <p className="text-sm font-semibold">{t("profile.themeStyle")}</p>
            <p className="text-xs text-muted-foreground">{t("profile.themeStyleHint")}</p>
          </div>
          <div className="grid gap-3 grid-cols-2">
            {THEME_VARIANTS.map((option) => {
              const isSelected = variant === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setVariant(option.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    "relative overflow-hidden rounded-2xl border px-3 py-3 text-left transition",
                    isSelected ? "border-primary shadow-glow" : "border-border/60 hover:border-primary/60"
                  )}
                >
                  <div className="mb-3 rounded-xl border border-border/40 bg-card/70 p-2">
                    <div
                      className="h-2 w-2/3 rounded-full"
                      style={{ background: option.preview.primary }}
                    />
                    <div
                      className="mt-2 h-1.5 w-full rounded-full"
                      style={{ background: option.preview.secondary }}
                    />
                    <div
                      className="mt-2 h-2 w-2 rounded-full"
                      style={{ background: option.preview.accent }}
                    />
                    <div
                      className="mt-2 h-2 w-full rounded-full"
                      style={{ background: option.preview.nav }}
                    />
                  </div>
                  <p className="text-sm font-semibold">{t(option.labelKey)}</p>
                  <p className="text-xs text-muted-foreground">{t(option.descriptionKey)}</p>
                  {isSelected ? (
                    <span className="absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-4 w-4" />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
