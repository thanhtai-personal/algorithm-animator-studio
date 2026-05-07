import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/lib/i18n";
import { GearClock } from "@/components/animations/gearClock/GearClock";

interface SyncDataDrawerProps {
  open: boolean;
  onPause: () => void;
  progress: { done: number; total: number };
  error: string | null;
  status: string;
  onClose: () => void;
  blocking?: boolean;
}

export function SyncDataDrawer({
  open,
  onPause,
  progress,
  error,
  status,
  onClose,
  blocking = false,
}: SyncDataDrawerProps) {
  const { t } = useI18n();
  if (!open) return null;
  const safeTotal = progress.total > 0 ? progress.total : 1;
  const percent = Math.min(100, Math.round((progress.done / safeTotal) * 100));
  const title = t("sync.syncing") || "Đang đồng bộ dữ liệu";
  const description =
    status || t("sync.pendingNotice", { count: progress.total }) || "Đang đồng bộ dữ liệu của bạn.";
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-[clamp(20px,4vw,48px)]"
      style={{
        background:
          "radial-gradient(1200px circle at 15% 20%, rgba(120, 170, 120, 0.18), transparent 55%), linear-gradient(135deg, #0b1220, #0f1c2d 45%, #0a1522)",
      }}
    >
      <div className="w-[min(92vw,560px)] rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(21,28,40,0.94),rgba(14,20,32,0.94))] p-[clamp(18px,3vw,28px)] text-white shadow-[0_32px_70px_rgba(0,0,0,0.45)] backdrop-blur-[18px]">
        <div className="grid place-items-center overflow-hidden rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_50%_30%,rgba(156,208,148,0.28),transparent_60%),linear-gradient(150deg,rgba(18,26,38,0.95),rgba(13,22,34,0.95))] p-[clamp(12px,2vw,18px)]">
          <GearClock useTrueTime />
        </div>
        <div className="mt-[clamp(16px,3vw,22px)] flex flex-col gap-3">
          <div className="space-y-2 text-center">
            <h2 className="text-lg font-semibold">{title}</h2>
            {description ? <p className="text-sm text-white/70">{description}</p> : null}
          </div>
          <div className="space-y-3">
            <Progress value={percent} className="h-2.5 bg-white/10" />
            <div className="flex items-center justify-between text-xs text-white/60">
              <span className="font-semibold text-white/80">{percent}%</span>
              <span>
                {progress.done}/{progress.total}
              </span>
            </div>
            {error ? <p className="text-xs text-rose-200">Lỗi: {error}</p> : null}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onPause}>
              Tạm dừng
            </Button>
            {blocking ? null : (
              <Button variant="ghost" onClick={onClose}>
                Đóng
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
