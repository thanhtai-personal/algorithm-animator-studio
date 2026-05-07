"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/utils/className";

interface DrawerFormShellProps {
  open: boolean;
  title: string;
  description?: string;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  footer?: ReactNode;
  widthClassName?: string;
  headerActions?: ReactNode;
  persistOnClose?: boolean;
}

const DRAWER_ANIMATION_MS = 220;
let activeBodyScrollLocks = 0;
let bodyOverflowBeforeDrawerLocks = "";

function lockBodyScroll() {
  if (typeof document === "undefined") return () => {};

  if (activeBodyScrollLocks === 0) {
    bodyOverflowBeforeDrawerLocks = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  activeBodyScrollLocks += 1;

  return () => {
    activeBodyScrollLocks = Math.max(0, activeBodyScrollLocks - 1);
    if (activeBodyScrollLocks === 0) {
      document.body.style.overflow = bodyOverflowBeforeDrawerLocks;
      bodyOverflowBeforeDrawerLocks = "";
    }
  };
}

export function DrawerFormShell({
  open,
  title,
  description,
  onOpenChange,
  children,
  footer,
  widthClassName,
  headerActions,
  persistOnClose = false,
}: DrawerFormShellProps) {
  const [isMounted, setIsMounted] = useState(open);
  const [isVisible, setIsVisible] = useState(open);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (visibleTimerRef.current) {
      clearTimeout(visibleTimerRef.current);
      visibleTimerRef.current = null;
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (open) {
      openTimerRef.current = setTimeout(() => {
        setIsMounted(true);
        openTimerRef.current = null;
      }, 0);
      visibleTimerRef.current = setTimeout(() => {
        setIsVisible(true);
        visibleTimerRef.current = null;
      }, 16);
      return;
    }

    visibleTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      visibleTimerRef.current = null;
    }, 0);
    if (!persistOnClose) {
      closeTimerRef.current = setTimeout(() => {
        setIsMounted(false);
        closeTimerRef.current = null;
      }, DRAWER_ANIMATION_MS);
    }
  }, [open, persistOnClose]);

  useEffect(() => {
    return () => {
      if (openTimerRef.current) {
        clearTimeout(openTimerRef.current);
      }
      if (visibleTimerRef.current) {
        clearTimeout(visibleTimerRef.current);
      }
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isMounted || !open || typeof document === "undefined") return;

    const unlockBodyScroll = lockBodyScroll();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      unlockBodyScroll();
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isMounted, onOpenChange, open]);

  if (!isMounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[220] flex justify-end bg-black/40 transition-opacity duration-200 ease-out motion-reduce:transition-none",
        isVisible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      )}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={() => onOpenChange(false)}
    >
      <div
        className={cn(
          "flex h-dvh max-h-dvh w-full max-w-xl translate-x-0 flex-col border-l border-border bg-card transition-transform duration-200 ease-out motion-reduce:transition-none",
          isVisible ? "translate-x-0" : "translate-x-full",
          widthClassName
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="shrink-0 border-b border-border px-4 py-4 sm:px-5">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              {description ? (
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
            {headerActions ? <div className="shrink-0">{headerActions}</div> : null}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>

        {footer ? (
          <footer className="shrink-0 border-t border-border bg-card/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-5 sm:py-4">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
