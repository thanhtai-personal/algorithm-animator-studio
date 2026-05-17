import { NavLink } from "react-router";
import { useYoutubeUpload } from "../hooks/useYoutubeUpload";
import { useI18n } from "../i18n";
import { AppIcon, PageHeader, StatusBadge } from "./AppHeader";
import { YoutubeUploadPanel } from "./YoutubeUploadPanel";
import { YoutubeScheduleCalendar } from "./youtube/YoutubeScheduleCalendar";
import { PageLoading } from "./PageLoading";

export function YoutubeUploadPage({ view = "upload" }: { view?: "upload" | "calendar" }) {
  const youtube = useYoutubeUpload();
  const { t } = useI18n();

  if (youtube.isInitializing) {
    return <PageLoading />;
  }

  return (
    <>
      <PageHeader
        title={t("youtubeTitle")}
        description={t("youtubeDescription")}
        badge={
          <StatusBadge variant={youtube.hasRefreshToken ? "success" : "error"}>
            <span className="size-1.5 rounded-full bg-current" />
            {youtube.hasRefreshToken ? t("authorized") : t("notAuthorized")}
          </StatusBadge>
        }
        actions={
          youtube.hasRefreshToken ? (
            <a className="button secondaryButton" href="https://studio.youtube.com" target="_blank" rel="noreferrer">
              <AppIcon name="youtube" className="size-4" />
              {t("openYoutubeStudio")}
            </a>
          ) : null
        }
      />

      <div className="youtubeSubTabs" aria-label={t("youtubeSubNavigation")}>
        <NavLink to="/youtube" end className={({ isActive }) => ["youtubeSubTab", isActive ? "active" : ""].filter(Boolean).join(" ")}>
          {t("youtubeUploadSubNav")}
        </NavLink>
        <NavLink to="/youtube/calendar" className={({ isActive }) => ["youtubeSubTab", isActive ? "active" : ""].filter(Boolean).join(" ")}>
          {t("youtubeCalendarSubNav")}
        </NavLink>
      </div>

      {view === "calendar" ? <YoutubeScheduleCalendar youtube={youtube} /> : <YoutubeUploadPanel youtube={youtube} />}
    </>
  );
}
