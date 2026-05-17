import { useI18n } from "../../i18n";
import { SectionCard } from "../AppHeader";
import type { YoutubeState } from "../YoutubeUploadPanel";

export function YoutubeOAuthForm({ youtube }: { youtube: YoutubeState }) {
  const { t } = useI18n();

  return (
    <SectionCard title={t("youtubeAuthorization")}>
      <div className="youtubeAuthActions">
        <button className="button secondaryButton" onClick={youtube.createAuthUrl} disabled={youtube.loading}>
          {youtube.hasRefreshToken ? t("reconnectYoutube") : t("openGoogleAuthorization")}
        </button>

        {youtube.hasRefreshToken ? (
          <button
            className="btn-ghost dangerButton"
            onClick={youtube.disconnectYoutube}
            disabled={youtube.loading}
            type="button"
          >
            {t("disconnectYoutube")}
          </button>
        ) : null}
      </div>

      <p className="helpText">{t("oauthHelp")}</p>
    </SectionCard>
  );
}
