"use client";

import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, RefreshCcw } from "lucide-react";
import type { AppLocale } from "@/constants/locale";
import { useNotificationsCenter } from "@/features/notifications/hooks/useNotificationsCenter";
import type { NotificationSeverity } from "@/types/notificationsModule";

interface NotificationsCenterProps {
  locale: AppLocale;
  triggerAriaLabel: string;
}

function severityDotClass(severity: NotificationSeverity): string {
  if (severity === "success") return "bg-success";
  if (severity === "warning") return "bg-warning";
  if (severity === "error") return "bg-destructive";
  return "bg-primary";
}

export const NotificationsCenter = observer(function NotificationsCenter({
  locale,
  triggerAriaLabel,
}: NotificationsCenterProps) {
  const model = useNotificationsCenter(locale);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const node = containerRef.current;
      if (!node) return;
      if (!node.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={triggerAriaLabel}
        onClick={() => setOpen((previous) => !previous)}
        className="relative rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <Bell className="h-5 w-5" />
        {model.unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
            {model.unreadCount > 99 ? "99+" : model.unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-11 z-50 w-[22rem] rounded-2xl border border-border bg-card shadow-xl">
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
            <div>
              <p className="text-sm font-semibold text-foreground">{model.copy.title}</p>
              <p className="text-[11px] text-muted-foreground">
                {model.unreadCount} {model.copy.unreadBadge} · {model.realtimeLabel}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={model.refresh}
                disabled={model.isRefreshing}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
                title={model.copy.refresh}
              >
                <RefreshCcw className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={model.markAllAsRead}
                disabled={model.unreadCount <= 0 || model.markAllReadPending}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
                title={model.copy.markAll}
              >
                <CheckCheck className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[26rem] overflow-auto p-2">
            {model.isLoading && model.items.length === 0 ? (
              <p className="px-2 py-4 text-sm text-muted-foreground">{model.copy.loading}</p>
            ) : null}

            {model.isError && model.items.length === 0 ? (
              <div className="space-y-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{model.errorMessage}</p>
                <button
                  type="button"
                  onClick={model.refresh}
                  className="rounded-lg border border-destructive/30 bg-background px-3 py-1 text-xs font-semibold text-foreground"
                >
                  {model.copy.retry}
                </button>
              </div>
            ) : null}

            {!model.isLoading && model.items.length === 0 ? (
              <p className="px-2 py-4 text-sm text-muted-foreground">{model.copy.empty}</p>
            ) : null}

            {model.items.length > 0 ? (
              <div className="space-y-1">
                {model.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => model.markAsRead(item.id)}
                    className={`w-full rounded-xl border p-2 text-left transition-colors ${
                      item.isRead
                        ? "border-transparent bg-background"
                        : "border-primary/20 bg-primary/5 hover:bg-primary/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-start gap-2">
                        <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${severityDotClass(item.severity)}`} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.body}</p>
                        </div>
                      </div>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {model.formatRelativeTime(item.createdAt)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}

            {model.hasMore ? (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={model.loadMore}
                  disabled={model.isLoadingMore}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground disabled:opacity-60"
                >
                  {model.isLoadingMore ? model.copy.loadingMore : model.copy.loadMore}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
});
