import { useEffect, useMemo, useRef, useState } from "react";
import {
  getRuntimeDependencyStatus,
  startRuntimeDependencyInstall,
  type RuntimeDependencyStatus,
  type RuntimeManualAction,
} from "../api/systemApi";
import { isDesktopRuntime } from "../utils/publicRuntime";

const POLL_INTERVAL_MS = 1600;

function openExternalUrl(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function getActionButtonLabel(action: RuntimeManualAction) {
  return action.cta || `Mở hướng dẫn ${action.label}`;
}

function ManualInstallCard({ action }: { action: RuntimeManualAction }) {
  return (
    <article className="runtimeManualCard">
      <div>
        <strong>{action.label}</strong>
        <p>{action.detail}</p>
      </div>

      <div className="runtimeManualCardActions">
        <button type="button" className="button text-xs" onClick={() => openExternalUrl(action.primaryUrl)}>
          {getActionButtonLabel(action)}
        </button>

        {action.urls?.length ? (
          <div className="runtimeManualLinkList">
            {action.urls.map((item) => (
              <button key={item.url} type="button" onClick={() => openExternalUrl(item.url)}>
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function SystemDependencySetup({ mode = "overlay" }: { mode?: "overlay" | "page" } = {}) {
  const [status, setStatus] = useState<RuntimeDependencyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const autoInstallStartedRef = useRef(false);
  const shouldRequireLocalRuntime = useMemo(() => mode === "page" || isDesktopRuntime(), [mode]);
  const isPageMode = mode === "page";

  async function refreshStatus(options?: { silent?: boolean }) {
    if (!options?.silent) {
      setLoading(true);
    }

    try {
      const nextStatus = await getRuntimeDependencyStatus();
      setStatus(nextStatus);
      setError("");
      return nextStatus;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không kiểm tra được runtime local.");
      return null;
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }

  async function startInstall() {
    setStarting(true);
    setError("");

    try {
      const nextStatus = await startRuntimeDependencyInstall();
      setStatus(nextStatus);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không bắt đầu được quá trình cài runtime.");
    } finally {
      setStarting(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    if (!shouldRequireLocalRuntime) {
      setLoading(false);
      setStatus(null);
      setError("");
      return undefined;
    }

    getRuntimeDependencyStatus()
      .then((nextStatus) => {
        if (cancelled) return;
        setStatus(nextStatus);
        setError("");
      })
      .catch((caught) => {
        if (cancelled) return;
        setError(caught instanceof Error ? caught.message : "Không kiểm tra được runtime local.");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [shouldRequireLocalRuntime]);

  useEffect(() => {
    if (!status?.installing) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      void refreshStatus({ silent: true });
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [status?.installing]);

  useEffect(() => {
    if (!status || autoInstallStartedRef.current) {
      return;
    }

    if (isPageMode || !shouldRequireLocalRuntime || !status.supported || status.ok || status.installing) {
      return;
    }

    autoInstallStartedRef.current = true;
    void startInstall();
  }, [isPageMode, shouldRequireLocalRuntime, status]);

  if (!shouldRequireLocalRuntime) {
    return null;
  }

  if (loading && !status) {
    if (isPageMode) {
      return (
        <section className="runtimeSetupCard" aria-live="polite">
          <div className="runtimeSetupInlineLoading">
            <div className="runtimeSetupLoadingIcon" aria-hidden />
            <span>Đang kiểm tra local runtime...</span>
          </div>
        </section>
      );
    }

    return (
      <section className="runtimeSetupOverlay" aria-live="polite" aria-modal="true" role="dialog">
        <div className="runtimeSetupModal runtimeSetupModalNarrow">
          <div className="runtimeSetupLoadingIcon" aria-hidden />
        </div>
      </section>
    );
  }

  if (!status && !error) {
    return null;
  }

  if (!isPageMode && status?.ok && !status.installing && !error) {
    return null;
  }

  const checks = status?.checks ?? [];
  const steps = status?.steps ?? [];
  const manualMessages = status?.manualActions ?? [];
  const manualActionLinks = status?.manualActionLinks ?? [];
  const capabilities = status?.capabilities;
  const isBusy = Boolean(status?.installing || starting);
  const canInstall = Boolean(status?.supported && !status.ok && !isBusy);
  const showManualInstall = Boolean(error || status?.error || manualActionLinks.length || (!canInstall && status && !status.ok));

  const sectionClassName = isPageMode ? "runtimeSetupCard" : "runtimeSetupOverlay";
  const panelClassName = isPageMode ? "runtimeSetupInline" : "runtimeSetupModal";

  return (
    <section className={sectionClassName} aria-live="polite" aria-modal={isPageMode ? undefined : "true"} role={isPageMode ? undefined : "dialog"}>
      <div className={panelClassName}>
        <div className="runtimeSetupHeader">
          <div>
            <p className="runtimeSetupEyebrow">Local runtime setup</p>
            <h2>{isPageMode ? "Health check local tools" : "Cài môi trường local để chạy app"}</h2>
            <p>
              {isPageMode
                ? "Kiểm tra Python, Piper, model giọng đọc và FFmpeg trên thiết bị này. Nếu không dùng desktop/local runtime, app vẫn có thể tạo video bằng Browser Recorder và dùng audio upload sẵn."
                : "App cần Python, Piper, model giọng đọc và FFmpeg. Màn hình này sẽ che toàn bộ app cho tới khi runtime sẵn sàng để tránh thao tác vào các màn hình chưa dùng được."}
            </p>
          </div>

          <div className="runtimeSetupActions">
            <button type="button" className="btn-ghost text-xs" onClick={() => void refreshStatus()} disabled={isBusy}>
              Kiểm tra lại
            </button>
            {canInstall ? (
              <button type="button" className="button text-xs" onClick={() => void startInstall()}>
                {isBusy ? "Đang cài..." : "Cài tự động runtime còn thiếu"}
              </button>
            ) : null}
          </div>
        </div>

        {error ? <div className="statusError mb-4">{error}</div> : null}
        {status?.error ? <div className="statusError mb-4">{status.error}</div> : null}

        {capabilities ? (
          <div className="runtimeCapabilityBar">
            <span>Nền tảng: <strong>{capabilities.platform}</strong></span>
            <span>winget: <strong>{capabilities.winget ? "có" : "không"}</strong></span>
            <span>Homebrew: <strong>{capabilities.homebrew ? "có" : "không"}</strong></span>
            <span>Python: <strong>{capabilities.pythonCommand || "chưa có"}</strong></span>
            <span>FFmpeg bundle: <strong>{capabilities.bundledFfmpeg ? "có" : "không"}</strong></span>
          </div>
        ) : null}

        {showManualInstall ? (
          <div className="runtimeManualActions">
            <div>
              <strong>Cài thủ công khi nút cài tự động không chạy được</strong>
              <p>
                Nếu máy không có winget/Homebrew, bị chặn quyền cài đặt, hoặc lệnh tự động thất bại, hãy mở link chính thức bên dưới để cài tool còn thiếu rồi bấm “Kiểm tra lại”.
              </p>
            </div>

            {manualMessages.length ? (
              <ul>
                {manualMessages.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            ) : null}

            {manualActionLinks.length ? (
              <div className="runtimeManualCardGrid">
                {manualActionLinks.map((action) => (
                  <ManualInstallCard key={action.key} action={action} />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="runtimeSetupGrid">
          <div className="runtimeSetupPanel">
            <h3>Trạng thái</h3>
            <div className="runtimeCheckList">
              {checks.length ? (
                checks.map((check) => (
                  <div key={check.key} className={`runtimeCheckItem ${check.ok ? "ok" : "missing"}`}>
                    <span>{check.ok ? "✓" : "!"}</span>
                    <div>
                      <strong>{check.label}</strong>
                      <small>{check.detail}</small>
                    </div>
                  </div>
                ))
              ) : (
                <div className="runtimeCheckItem missing">
                  <span>!</span>
                  <div>
                    <strong>Chưa có dữ liệu kiểm tra</strong>
                    <small>Backend local chưa trả về trạng thái runtime.</small>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="runtimeSetupPanel">
            <h3>Tiến trình cài đặt</h3>
            <div className="runtimeStepList">
              {steps.length ? (
                steps.map((step) => (
                  <div key={step.id} className={`runtimeStepItem ${step.status}`}>
                    <span className="runtimeStepIcon">{step.status === "done" || step.status === "skipped" ? "✓" : step.status === "error" ? "!" : "•"}</span>
                    <div>
                      <strong>{step.label}</strong>
                      {step.detail ? <small>{step.detail}</small> : null}
                    </div>
                  </div>
                ))
              ) : (
                <div className="runtimeStepItem pending">
                  <span className="runtimeStepIcon">•</span>
                  <div>
                    <strong>Chưa bắt đầu</strong>
                    <small>{isDesktopRuntime ? "App sẽ tự cài khi phát hiện thiếu runtime." : "Dev/browser mode sẽ không tự chạy lệnh cài đặt."}</small>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {status ? (
          <details className="runtimeSetupLog">
            <summary>Chi tiết cài đặt</summary>
            <pre>{[
              `Install root: ${status.installRoot}`,
              `Model dir: ${status.modelDir}`,
              `Piper: ${status.piperExe}`,
              `FFmpeg: ${status.ffmpegExe}`,
              `FFprobe: ${status.ffprobeExe}`,
              "",
              ...(status.log ?? []),
            ].join("\n")}</pre>
          </details>
        ) : null}
      </div>
    </section>
  );
}
