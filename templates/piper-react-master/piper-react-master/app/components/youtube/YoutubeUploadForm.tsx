import { useI18n } from "../../i18n";
import { AppIcon, Field, SectionCard } from "../AppHeader";
import type { YoutubeState } from "../YoutubeUploadPanel";
import { Checkbox, SelectInput, TextArea, TextInput } from "./YoutubeFormControls";

export function YoutubeUploadForm({ youtube }: { youtube: YoutubeState }) {
  const { t } = useI18n();

  return (
    <SectionCard title={t("uploadVideo")}>
      {youtube.generatedVideo ? (
        <div className="stepSummary">
          <div>
            <strong>{t("youtubeGeneratedVideoSource")}</strong>
            <small>{t("youtubeGeneratedVideoSourceHelp")}</small>
          </div>
          <span>{youtube.generatedVideo.relativePath}</span>
          <button type="button" className="btn-ghost" onClick={youtube.clearGeneratedVideoSelection}>
            {t("clearGeneratedVideoSelection")}
          </button>
        </div>
      ) : null}

      <Field label={t("videoFile")} hint={youtube.generatedVideo && !youtube.videoFile ? t("youtubeManualUploadOverrides") : undefined}>
        <div className="border border-dashed border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
          <AppIcon name="video" className="size-6 mx-auto text-muted-foreground" />
          <div className="mt-2 text-sm text-muted-foreground break-all">
            {youtube.videoFile ? youtube.videoFile.name : youtube.generatedVideo ? t("usingGeneratedVideo") : t("videoFile")}
          </div>
          <input
            id="youtubeVideo"
            type="file"
            accept="video/*"
            onChange={(event) => youtube.setVideoFile(event.target.files?.[0] || null)}
            className="mt-3 max-w-full"
          />
        </div>
      </Field>

      <TextInput
        label={t("title")}
        value={youtube.uploadForm.title}
        onChange={(title) => youtube.setUploadForm((current) => ({ ...current, title }))}
      />

      <TextArea
        label={t("description")}
        value={youtube.uploadForm.description}
        onChange={(description) =>
          youtube.setUploadForm((current) => ({ ...current, description }))
        }
      />

      <div className="grid md:grid-cols-2 gap-4">
        <TextInput
          label={t("tags")}
          value={youtube.uploadForm.tags}
          onChange={(tags) => youtube.setUploadForm((current) => ({ ...current, tags }))}
        />
        <TextInput
          label={t("publishAt")}
          type="datetime-local"
          value={youtube.uploadForm.publishAt}
          onChange={(publishAt) => youtube.setUploadForm((current) => ({ ...current, publishAt }))}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <SelectInput
          label={t("privacyStatus")}
          value={youtube.uploadForm.privacyStatus}
          onChange={(privacyStatus) =>
            youtube.setUploadForm((current) => ({ ...current, privacyStatus }))
          }
          options={[
            { label: t("unlisted"), value: "unlisted" },
            { label: t("private"), value: "private" },
            { label: t("public"), value: "public" },
          ]}
        />
        <TextInput
          label={t("categoryId")}
          value={youtube.uploadForm.categoryId}
          onChange={(categoryId) => youtube.setUploadForm((current) => ({ ...current, categoryId }))}
        />
      </div>

      <Field label={t("playlist")} hint={t("playlistHelp")}>
        <select
          className="input"
          id="youtubePlaylist"
          value={youtube.uploadForm.playlistId}
          onChange={(event) =>
            youtube.setUploadForm((current) => ({ ...current, playlistId: event.target.value }))
          }
          disabled={youtube.playlistsLoading}
        >
          <option value="">{youtube.playlistsLoading ? t("playlistLoading") : t("noPlaylist")}</option>
          {youtube.playlists.map((playlist) => (
            <option key={playlist.id} value={playlist.id}>
              {playlist.title}
            </option>
          ))}
        </select>
      </Field>

      <div className="checkRow">
        <Checkbox
          label={t("madeForKids")}
          checked={youtube.uploadForm.madeForKids}
          onChange={(madeForKids) => youtube.setUploadForm((current) => ({ ...current, madeForKids }))}
        />
        <Checkbox
          label={t("notifySubscribers")}
          checked={youtube.uploadForm.notifySubscribers}
          onChange={(notifySubscribers) =>
            youtube.setUploadForm((current) => ({ ...current, notifySubscribers }))
          }
        />
        <Checkbox
          label={t("containsSyntheticMedia")}
          checked={youtube.uploadForm.containsSyntheticMedia}
          onChange={(containsSyntheticMedia) =>
            youtube.setUploadForm((current) => ({ ...current, containsSyntheticMedia }))
          }
        />
      </div>

      <button className="button w-full" onClick={youtube.upload} disabled={youtube.loading}>
        <AppIcon name="youtube" className="size-4" />
        {youtube.loading ? t("processing") : t("uploadToYoutube")}
      </button>
    </SectionCard>
  );
}
