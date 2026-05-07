import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryProvider } from "@/providers/QueryProvider";
import { App } from "@/App";
import appConfig from "../app-config.json";
import "@/styles.css";

const runtimeWindow = window as Window & { APP_CONFIG?: unknown };
if (!runtimeWindow.APP_CONFIG) {
  runtimeWindow.APP_CONFIG = appConfig;
}

const rootElement = document.getElementById("app");
if (!rootElement) {
  throw new Error("Missing #app root element");
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryProvider>
      <App />
    </QueryProvider>
  </StrictMode>
);
