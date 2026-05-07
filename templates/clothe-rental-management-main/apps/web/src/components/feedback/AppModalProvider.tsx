"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ModalTone = "default" | "danger";

interface BaseModalOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: ModalTone;
}

export type AppModalAlertOptions = Omit<BaseModalOptions, "cancelText">;

export type AppModalConfirmOptions = BaseModalOptions;

export interface AppModalPromptOptions extends BaseModalOptions {
  defaultValue?: string;
  placeholder?: string;
  inputLabel?: string;
  inputType?: "text" | "number";
  required?: boolean;
}

interface AppModalContextValue {
  alert: (options: AppModalAlertOptions) => Promise<void>;
  confirm: (options: AppModalConfirmOptions) => Promise<boolean>;
  prompt: (options: AppModalPromptOptions) => Promise<string | null>;
}

type AlertRequest = {
  id: number;
  type: "alert";
  options: AppModalAlertOptions;
  resolve: () => void;
};

type ConfirmRequest = {
  id: number;
  type: "confirm";
  options: AppModalConfirmOptions;
  resolve: (value: boolean) => void;
};

type PromptRequest = {
  id: number;
  type: "prompt";
  options: AppModalPromptOptions;
  resolve: (value: string | null) => void;
};

type ModalRequest = AlertRequest | ConfirmRequest | PromptRequest;

const fallbackContextValue: AppModalContextValue = {
  alert: async () => {},
  confirm: async () => false,
  prompt: async () => null,
};

const AppModalContext = createContext<AppModalContextValue>(fallbackContextValue);

interface AppModalProviderProps {
  children: ReactNode;
}

export function AppModalProvider({ children }: AppModalProviderProps) {
  const [queue, setQueue] = useState<ModalRequest[]>([]);
  const idRef = useRef(0);
  const promptInputRef = useRef<HTMLInputElement | null>(null);
  const activeRequest = queue[0] ?? null;
  const activePromptRequest =
    activeRequest && activeRequest.type === "prompt" ? activeRequest : null;

  const shiftQueue = useCallback((resolver: (request: ModalRequest) => void) => {
    setQueue((currentQueue) => {
      const [request, ...rest] = currentQueue;
      if (request) {
        resolver(request);
      }
      return rest;
    });
  }, []);

  useEffect(() => {
    if (!activeRequest || typeof document === "undefined") return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      shiftQueue((request) => {
        if (request.type === "confirm") {
          request.resolve(false);
          return;
        }
        if (request.type === "prompt") {
          request.resolve(null);
          return;
        }
        request.resolve();
      });
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeRequest, shiftQueue]);

  useEffect(() => {
    if (!activePromptRequest) return;
    promptInputRef.current?.focus();
  }, [activePromptRequest]);

  const alert = useCallback((options: AppModalAlertOptions) => {
    return new Promise<void>((resolve) => {
      setQueue((previous) => [
        ...previous,
        {
          id: ++idRef.current,
          type: "alert",
          options,
          resolve,
        },
      ]);
    });
  }, []);

  const confirm = useCallback((options: AppModalConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setQueue((previous) => [
        ...previous,
        {
          id: ++idRef.current,
          type: "confirm",
          options,
          resolve,
        },
      ]);
    });
  }, []);

  const prompt = useCallback((options: AppModalPromptOptions) => {
    return new Promise<string | null>((resolve) => {
      setQueue((previous) => [
        ...previous,
        {
          id: ++idRef.current,
          type: "prompt",
          options,
          resolve,
        },
      ]);
    });
  }, []);

  const handleCancel = useCallback(() => {
    shiftQueue((request) => {
      if (request.type === "confirm") {
        request.resolve(false);
        return;
      }
      if (request.type === "prompt") {
        request.resolve(null);
        return;
      }
      request.resolve();
    });
  }, [shiftQueue]);

  const handleConfirm = useCallback(() => {
    if (!activeRequest) return;
    const currentPromptValue = promptInputRef.current?.value ?? "";
    if (activePromptRequest?.options.required && currentPromptValue.trim().length === 0) {
      return;
    }

    shiftQueue((request) => {
      if (request.type === "confirm") {
        request.resolve(true);
        return;
      }
      if (request.type === "prompt") {
        request.resolve(currentPromptValue);
        return;
      }
      request.resolve();
    });
  }, [activePromptRequest, activeRequest, shiftQueue]);

  const contextValue = useMemo<AppModalContextValue>(
    () => ({
      alert,
      confirm,
      prompt,
    }),
    [alert, confirm, prompt]
  );

  const [isVietnameseLanguage, setIsVietnameseLanguage] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    setIsVietnameseLanguage(document.documentElement.lang.toLowerCase().startsWith("vi"));
  }, []);

  const defaultCancelLabel = isVietnameseLanguage ? "Hủy" : "Cancel";
  const confirmLabel = activeRequest?.options.confirmText ?? "OK";
  const cancelLabel = activeRequest?.type === "alert"
    ? null
    : activeRequest?.options.cancelText ?? defaultCancelLabel;
  const isDangerTone = activeRequest?.options.tone === "danger";

  return (
    <AppModalContext.Provider value={contextValue}>
      {children}

      {activeRequest ? (
        <div
          className="fixed inset-0 z-[320] flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={activeRequest.options.title}
          onClick={handleCancel}
        >
          <form
            className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl"
            onSubmit={(event) => {
              event.preventDefault();
              handleConfirm();
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-foreground">{activeRequest.options.title}</h3>
            {activeRequest.options.description ? (
              <p className="mt-2 text-sm text-muted-foreground">{activeRequest.options.description}</p>
            ) : null}

            {activePromptRequest ? (
              <div className="mt-4 space-y-1.5">
                {activePromptRequest.options.inputLabel ? (
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {activePromptRequest.options.inputLabel}
                  </p>
                ) : null}
                <input
                  key={activePromptRequest.id}
                  ref={promptInputRef}
                  type={activePromptRequest.options.inputType ?? "text"}
                  defaultValue={activePromptRequest.options.defaultValue ?? ""}
                  placeholder={activePromptRequest.options.placeholder}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none ring-primary/40 transition focus:ring-2"
                />
              </div>
            ) : null}

            <div className="mt-5 flex items-center justify-end gap-2">
              {activeRequest.type !== "alert" ? (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-semibold text-muted-foreground transition hover:bg-accent"
                >
                  {cancelLabel ?? "Cancel"}
                </button>
              ) : null}
              <button
                type="submit"
                className={`inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold transition ${
                  isDangerTone
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </AppModalContext.Provider>
  );
}

export function useAppModal() {
  return useContext(AppModalContext);
}
