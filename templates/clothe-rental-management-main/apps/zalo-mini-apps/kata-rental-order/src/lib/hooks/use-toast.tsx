import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type ToastVariant = "info" | "success" | "error";

export type ToastOptions = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number; // ms, 0 = persistent
};

type ToastInternal = ToastOptions & { id: string };

type ToastContextValue = {
  toast: (opts: ToastOptions) => string;
  dismiss: (id?: string) => void;
  toasts: ToastInternal[];
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastInternal[]>([]);
  const timers = useRef<Map<string, number>>(new Map());

  const toast = useCallback((opts: ToastOptions) => {
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
    const duration = opts.duration ?? 4000;
    const entry: ToastInternal = { id, ...opts, duration } as any;
    setToasts((s) => [entry, ...s].slice(0, 5));

    if (duration > 0) {
      const timerId = window.setTimeout(() => {
        setToasts((s) => s.filter((t) => t.id !== id));
        timers.current.delete(id);
      }, duration);
      timers.current.set(id, timerId as unknown as number);
    }

    return id;
  }, []);

  const dismiss = useCallback((id?: string) => {
    if (!id) {
      timers.current.forEach((tid) => window.clearTimeout(tid));
      timers.current.clear();
      setToasts([]);
      return;
    }
    setToasts((s) => s.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  useEffect(() => {
    return () => {
      timers.current.forEach((tid) => window.clearTimeout(tid));
      timers.current.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss, toasts }}>{children}</ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return { toast: ctx.toast, dismiss: ctx.dismiss };
}

export function ToastContainer() {
  const ctx = useContext(ToastContext);
  if (!ctx) return null;

  const mount = typeof document !== "undefined" ? document.body : null;
  if (!mount) return null;

  return createPortal(
    <div className="toast-root" role="status" aria-live="polite">
      {ctx.toasts.map((t) => (
        <div key={t.id} className={`toast-item toast-${t.variant ?? "info"}`}>
          <div className="toast-body">
            <div className="toast-title">{t.title}</div>
            {t.description ? <div className="toast-desc">{t.description}</div> : null}
          </div>
          <button className="toast-close" onClick={() => ctx.dismiss(t.id)} aria-label="Close">
            ×
          </button>
        </div>
      ))}
    </div>,
    mount,
  );
}

export default null;
