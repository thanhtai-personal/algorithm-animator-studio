import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/lib/i18n";

import type { GearClockColors } from "@/components/animations/gearClock/GearClock";
import { GearClock } from "@/components/animations/gearClock/GearClock";

interface AnonymousSyncProgressOverlayProps {
  open: boolean;
  title?: string;
  description?: string;
  done: number;
  total: number;
  gearColors?: GearClockColors;
}

export function AnonymousSyncProgressOverlay({
  open,
  title,
  description,
  done,
  total,
  gearColors,
}: AnonymousSyncProgressOverlayProps) {
  const { t } = useI18n();
  if (!open) return null;

  const resolvedTitle = title ?? t("auth.anonymousSyncTitle");
  const resolvedDescription = description ?? t("auth.anonymousSyncDescription");
  const safeTotal = total > 0 ? total : 1;
  const progress = Math.min(100, Math.round((done / safeTotal) * 100));

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
          <GearClock colors={gearColors} useTrueTime />
        </div>
        <div className="mt-[clamp(16px,3vw,22px)] flex flex-col gap-3">
          <div className="space-y-2 text-center">
            <h2 className="text-lg font-semibold">{resolvedTitle}</h2>
            {resolvedDescription ? <p className="text-sm text-white/70">{resolvedDescription}</p> : null}
          </div>
          <div className="space-y-3">
            <Progress value={progress} className="h-2.5 bg-white/10" />
            <div className="flex items-center justify-between text-xs text-white/60">
              <span className="font-semibold text-white/80">{progress}%</span>
              <span>
                {done}/{total}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
