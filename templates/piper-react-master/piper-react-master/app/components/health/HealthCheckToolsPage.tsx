import { useMemo, useState } from "react";
import { useI18n } from "../../i18n";
import {
  getPreferredVideoMimeType,
  isCanvasVideoRecorderSupported,
  isDesktopRuntime,
  PUBLIC_WEB_BUILD,
} from "../../utils/publicRuntime";
import {
  denyLocalRuntimeAccess,
  getLocalRuntimeAccessState,
  grantLocalRuntimeAccess,
  resetLocalRuntimeAccess,
  type LocalRuntimeAccessState,
} from "../../utils/localRuntimeAccess";
import { PageHeader, SectionCard, StatusBadge } from "../AppHeader";
import { SystemDependencySetup } from "../SystemDependencySetup";

type ToolStatus = {
  name: string;
  ready: boolean;
  detail: string;
};

const LOCAL_ACCESS_STATUS_LABEL_KEYS: Record<LocalRuntimeAccessState, "localRuntimeAccessStatus_granted" | "localRuntimeAccessStatus_denied" | "localRuntimeAccessStatus_unset"> = {
  granted: "localRuntimeAccessStatus_granted",
  denied: "localRuntimeAccessStatus_denied",
  unset: "localRuntimeAccessStatus_unset",
};

function getAccessBadgeVariant(accessState: LocalRuntimeAccessState) {
  return accessState === "granted" ? "success" : accessState === "denied" ? "error" : "neutral";
}

export function HealthCheckToolsPage() {
  const { t } = useI18n();
  const [localAccessState, setLocalAccessState] = useState(() => getLocalRuntimeAccessState());
  const localRuntimeAllowed = localAccessState === "granted";
  const browserTools = useMemo<ToolStatus[]>(() => {
    const browserRecorderReady = isCanvasVideoRecorderSupported();
    const videoMimeType = getPreferredVideoMimeType();

    return [
      {
        name: t("healthBrowserRecorderTool"),
        ready: browserRecorderReady,
        detail: browserRecorderReady
          ? t("healthBrowserRecorderReady", { mime: videoMimeType || "default" })
          : t("healthBrowserRecorderUnavailable"),
      },
      {
        name: t("healthDesktopRuntimeTool"),
        ready: isDesktopRuntime(),
        detail: isDesktopRuntime() ? t("healthDesktopRuntimeReady") : t("healthDesktopRuntimeOptional"),
      },
      {
        name: t("healthPublicBuildTool"),
        ready: PUBLIC_WEB_BUILD,
        detail: PUBLIC_WEB_BUILD ? t("healthPublicBuildReady") : t("healthPublicBuildLocal"),
      },
    ];
  }, [t]);

  const readyCount = browserTools.filter((tool) => tool.ready).length + (localRuntimeAllowed ? 1 : 0);
  const totalCount = browserTools.length + 1;

  function refreshAccessState() {
    setLocalAccessState(getLocalRuntimeAccessState());
  }

  function handleGrantLocalAccess() {
    grantLocalRuntimeAccess();
    refreshAccessState();
  }

  function handleDenyLocalAccess() {
    denyLocalRuntimeAccess();
    refreshAccessState();
  }

  function handleResetLocalAccess() {
    resetLocalRuntimeAccess();
    refreshAccessState();
  }

  return (
    <>
      <PageHeader
        title={t("healthToolsTitle")}
        description={t("healthToolsDescription")}
        badge={
          <StatusBadge variant={readyCount ? "success" : "neutral"}>
            {t("healthToolsReadyCount", { count: readyCount, total: totalCount })}
          </StatusBadge>
        }
      />

      <div className="healthToolsLayout">
        <SectionCard title={t("healthBrowserToolsTitle")} description={t("healthBrowserToolsDescription")}>
          <div className="healthToolGrid">
            {browserTools.map((tool) => (
              <article key={tool.name} className={["healthToolItem", tool.ready ? "ready" : "missing"].filter(Boolean).join(" ")}>
                <span>{tool.ready ? "✓" : "!"}</span>
                <div>
                  <strong>{tool.name}</strong>
                  <small>{tool.detail}</small>
                </div>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title={t("localRuntimeAccessTitle")}
          description={t("localRuntimeAccessDescription")}
        >
          <div>
            <StatusBadge variant={getAccessBadgeVariant(localAccessState)}>
              {t(LOCAL_ACCESS_STATUS_LABEL_KEYS[localAccessState])}
            </StatusBadge>
          </div>
          <div className="localRuntimeAccessPanel">
            <div>
              <strong>{t("localRuntimeAccessCurrentTitle")}</strong>
              <p>{localRuntimeAllowed ? t("localRuntimeAccessGrantedHelp") : t("localRuntimeAccessMissingHelp")}</p>
            </div>
            <div className="localRuntimeAccessActions">
              <button type="button" className="button text-xs" onClick={handleGrantLocalAccess}>
                {t("grantLocalRuntimeAccess")}
              </button>
              <button type="button" className="btn-ghost text-xs" onClick={handleDenyLocalAccess}>
                {t("denyLocalRuntimeAccess")}
              </button>
              <button type="button" className="btn-ghost text-xs" onClick={handleResetLocalAccess}>
                {t("resetLocalRuntimeAccess")}
              </button>
            </div>
          </div>
        </SectionCard>

        {localRuntimeAllowed ? (
          <SystemDependencySetup mode="page" />
        ) : (
          <section className="runtimeSetupCard">
            <div className="runtimeSetupInline">
              <div className="runtimeSetupHeader">
                <div>
                  <p className="runtimeSetupEyebrow">Local runtime setup</p>
                  <h2>{t("localRuntimeAccessBlockedTitle")}</h2>
                  <p>{t("localRuntimeAccessBlockedDescription")}</p>
                </div>
                <div className="runtimeSetupActions">
                  <button type="button" className="button text-xs" onClick={handleGrantLocalAccess}>
                    {t("grantLocalRuntimeAccess")}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
