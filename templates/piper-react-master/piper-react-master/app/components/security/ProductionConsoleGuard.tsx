import { useEffect, useMemo, useRef, useState } from "react";

const DEVTOOLS_SIZE_THRESHOLD = 160;
const DEVTOOLS_CHECK_INTERVAL_MS = 700;
const DEBUGGER_PULSE_INTERVAL_MS = 800;

function isConsoleGuardEnabled() {
  return import.meta.env.PROD && import.meta.env.VITE_ENABLE_CONSOLE_GUARD !== "false";
}

function isDevToolsLikelyOpen() {
  if (typeof window === "undefined") {
    return false;
  }

  const widthGap = Math.abs(window.outerWidth - window.innerWidth);
  const heightGap = Math.abs(window.outerHeight - window.innerHeight);

  return widthGap > DEVTOOLS_SIZE_THRESHOLD || heightGap > DEVTOOLS_SIZE_THRESHOLD;
}

export function ProductionConsoleGuard() {
  const enabled = useMemo(() => isConsoleGuardEnabled(), []);
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const devToolsOpenRef = useRef(false);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return undefined;
    }

    const updateState = () => {
      const nextValue = isDevToolsLikelyOpen();
      devToolsOpenRef.current = nextValue;
      setDevToolsOpen(nextValue);
    };

    updateState();
    const intervalId = window.setInterval(updateState, DEVTOOLS_CHECK_INTERVAL_MS);
    window.addEventListener("resize", updateState);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("resize", updateState);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      if (!devToolsOpenRef.current) {
        return;
      }

      // Production-only guard: make manual console inspection intentionally inconvenient.
      // eslint-disable-next-line no-debugger
      debugger;
    }, DEBUGGER_PULSE_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [enabled]);

  if (!enabled || !devToolsOpen) {
    return null;
  }

  return (
    <div className="productionConsoleGuard" role="alertdialog" aria-modal="true" aria-labelledby="productionConsoleGuardTitle">
      <div className="productionConsoleGuardCard">
        <div className="productionConsoleGuardIcon" aria-hidden="true">!</div>
        <div className="productionConsoleGuardContent">
          <p className="productionConsoleGuardEyebrow">Cảnh báo bảo mật</p>
          <h2 id="productionConsoleGuardTitle">Không mở Developer Tools / Console trên bản production</h2>
          <p>
            Việc thao tác trong console có thể làm lộ token đăng nhập, dữ liệu cục bộ, tệp tài nguyên hoặc làm lỗi phiên làm việc của bạn.
          </p>
          <p className="productionConsoleGuardHint">
            Hãy đóng DevTools/Console để tiếp tục sử dụng ứng dụng an toàn.
          </p>
        </div>
      </div>
    </div>
  );
}
