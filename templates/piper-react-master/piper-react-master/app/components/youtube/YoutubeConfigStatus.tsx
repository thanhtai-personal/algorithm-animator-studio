import { useI18n } from "../../i18n";
import { SectionCard, StatusBadge } from "../AppHeader";
import type { YoutubeState } from "../YoutubeUploadPanel";

export function YoutubeConfigStatus({ youtube }: { youtube: YoutubeState }) {
  const { t } = useI18n();

  return (
    <SectionCard title={t("configStatus")}>
      <div className="statusGrid">
        <StatusBadge variant={youtube.configStatus?.hasClientId ? "success" : "error"}>
          {t("clientId")}
        </StatusBadge>
        <StatusBadge variant={youtube.configStatus?.hasClientSecret ? "success" : "error"}>
          {t("clientSecret")}
        </StatusBadge>
        <StatusBadge variant={youtube.hasRefreshToken ? "success" : "error"}>
          {t("refreshToken")}
        </StatusBadge>
      </div>
      <p className="helpText">{t("refreshTokenHelp")}</p>
    </SectionCard>
  );
}
