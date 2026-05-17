import type { useYoutubeUpload } from "../hooks/useYoutubeUpload";
import { useI18n } from "../i18n";
import { AppIcon, SectionCard } from "./AppHeader";
import { YoutubeConfigStatus } from "./youtube/YoutubeConfigStatus";
import { YoutubeOAuthForm } from "./youtube/YoutubeOAuthForm";
import { YoutubeUploadForm } from "./youtube/YoutubeUploadForm";

export type YoutubeState = ReturnType<typeof useYoutubeUpload>;

export function YoutubeUploadPanel({ youtube }: { youtube: YoutubeState }) {
  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] items-start">
        <div className="space-y-6 min-w-0">
          <YoutubeUploadForm youtube={youtube} />
          {youtube.message ? <div className="message">{youtube.message}</div> : null}
          {youtube.uploadResult?.url ? <YoutubeUploadResult youtube={youtube} /> : null}
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto xl:pr-1">
          <YoutubeConfigStatus youtube={youtube} />
          <YoutubeOAuthForm youtube={youtube} />
        </aside>
      </div>
    </>
  );
}

function YoutubeUploadResult({ youtube }: { youtube: YoutubeState }) {
  const { t } = useI18n();

  return (
    <SectionCard title={t("uploadedVideo")}>
      <p className="fileName">
        {t("youtubeVideoId")} <strong>{youtube.uploadResult?.id}</strong>
      </p>
      <a className="download" href={youtube.uploadResult?.url} target="_blank" rel="noreferrer">
        <AppIcon name="youtube" className="size-4" />
        {t("openVideo")}
      </a>
    </SectionCard>
  );
}
