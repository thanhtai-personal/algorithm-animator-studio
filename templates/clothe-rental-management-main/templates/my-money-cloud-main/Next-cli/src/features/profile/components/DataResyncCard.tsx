import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useI18n } from "@/lib/i18n";
import { Loader2 } from "lucide-react";
import { useDataResync } from "../hooks/useDataResync";

export function DataResyncCard() {
  const { t } = useI18n();
  const {
    handleResync,
    loading
  } = useDataResync();

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="text-lg">{t("resync.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{t("resync.description")}</p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("common.loading")}
                </>
              ) : (
                t("resync.clearCache")
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("resync.title")}</AlertDialogTitle>
              <AlertDialogDescription>{t("resync.confirm")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={handleResync} disabled={loading}>
                {t("common.confirm") || t("common.done")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
