import { useEffect, useState } from "react";

const STORAGE_KEY = "kai-studio.fantastic-mode";
const CHANGE_EVENT = "kai-studio:fantastic-mode-change";

function readFantasticMode() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "true";
}

function applyFantasticMode(enabled: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("fantastic-mode", enabled);
  document.documentElement.dataset.fantasticMode = enabled ? "on" : "off";
}

export function writeFantasticMode(enabled: boolean) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, String(enabled));
    window.dispatchEvent(new CustomEvent<boolean>(CHANGE_EVENT, { detail: enabled }));
  }
  applyFantasticMode(enabled);
}

export function useFantasticMode() {
  const [enabled, setEnabled] = useState(() => readFantasticMode());

  useEffect(() => {
    applyFantasticMode(enabled);
  }, [enabled]);

  useEffect(() => {
    function handleChange(event: Event) {
      const customEvent = event as CustomEvent<boolean>;
      setEnabled(Boolean(customEvent.detail));
    }

    window.addEventListener(CHANGE_EVENT, handleChange);
    return () => window.removeEventListener(CHANGE_EVENT, handleChange);
  }, []);

  function updateEnabled(nextEnabled: boolean) {
    setEnabled(nextEnabled);
    writeFantasticMode(nextEnabled);
  }

  return [enabled, updateEnabled] as const;
}
