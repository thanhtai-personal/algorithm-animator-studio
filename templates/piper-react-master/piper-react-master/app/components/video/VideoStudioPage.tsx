import { Link } from "react-router";
import { useVideoStudio } from "../../hooks/useVideoStudio";
import { useI18n } from "../../i18n";
import { AppIcon, Field, PageHeader, SectionCard, StatusBadge } from "../AppHeader";
import { SelectInput, TextInput } from "../youtube/YoutubeFormControls";
import { PageLoading } from "../PageLoading";

type VideoState = ReturnType<typeof useVideoStudio>;

export function VideoStudioPage() {
  const video = useVideoStudio();
  const { t } = useI18n();

  if (video.isInitializing) {
    return <PageLoading />;
  }

  return (
    <div className="videoStudioPage">
      <PageHeader
        title={t("videoStudioTitle")}
        description={t("videoStudioDescription")}
        badge={
          <StatusBadge variant={video.previewVideo?.videoUrl ? "success" : "neutral"}>
            <span className="size-1.5 rounded-full bg-current" />
            {video.previewVideo?.videoUrl ? t("videoReady") : t("videoDraft")}
          </StatusBadge>
        }
      />

      <div className="videoStudioLayout">
        <div className="videoStudioFormColumn">
          <VideoInputCard video={video} />
          <VideoConfigCard video={video} />
          {video.message ? <div className="message">{video.message}</div> : null}
        </div>

        <VideoPreviewCard video={video} />
      </div>
    </div>
  );
}

function VideoInputCard({ video }: { video: VideoState }) {
  const { t } = useI18n();
  const selectedAudio = video.generatedAudio.find((audio) => audio.relativePath === video.selectedAudioPath);

  return (
    <SectionCard title={t("videoSetupTitle")} description={t("videoSetupDescription")}>
      <div className="videoCompactGrid videoCompactGridTwo">
        <Field label={t("videoRenderEngine")}>
          <div className="radioGrid videoCompactRadioGrid">
            <label className="radioOption videoCompactRadioOption">
              <input
                type="radio"
                name="videoRenderEngine"
                value="local-ffmpeg"
                checked={video.renderEngine === "local-ffmpeg"}
                disabled={!video.localVideoAvailable}
                onChange={() => video.setRenderEngine("local-ffmpeg")}
              />
              <span>
                <strong>{t("videoRenderEngineLocal")}</strong>
                <small>{video.localVideoAvailable ? t("videoRenderEngineLocalHelp") : t("videoRenderEngineLocalUnavailable")}</small>
              </span>
            </label>

            <label className="radioOption videoCompactRadioOption">
              <input
                type="radio"
                name="videoRenderEngine"
                value="browser-recorder"
                checked={video.renderEngine === "browser-recorder"}
                disabled={!video.browserVideoSupported}
                onChange={() => video.setRenderEngine("browser-recorder")}
              />
              <span>
                <strong>{t("videoRenderEngineBrowser")}</strong>
                <small>{video.browserVideoSupported ? t("videoRenderEngineBrowserHelp") : t("videoRenderEngineBrowserUnavailable")}</small>
              </span>
            </label>
          </div>
        </Field>

        <Field label={t("audioSource")} hint={t("videoDefaultVoiceHelp")}>
          <select
            className="input"
            id="videoAudioSource"
            value={video.audioSourceMode}
            onChange={(event) => video.setAudioSourceMode(event.target.value === "upload" ? "upload" : "existing")}
          >
            <option value="existing">{t("audioSourceExisting")}</option>
            <option value="upload">{t("audioSourceUpload")}</option>
          </select>
        </Field>
      </div>

      {video.renderEngine === "browser-recorder" ? (
        <p className="browserToolNotice text-xs text-muted-foreground">{t("videoRenderEngineBrowserNote")}</p>
      ) : null}

      {video.audioSourceMode === "upload" ? (
        <Field label={t("uploadAudio")} hint={t("uploadAudioHelp")}>
          <input
            id="uploadAudio"
            type="file"
            accept="audio/wav,audio/mpeg,audio/mp4,audio/aac,audio/ogg,audio/opus,.wav,.mp3,.m4a,.aac,.ogg,.opus"
            onChange={(event) => video.setUploadedAudioFile(event.target.files?.[0] || null)}
          />
          {video.uploadedAudioFile ? <small>{video.uploadedAudioFile.name}</small> : null}
          {video.uploadedAudioPreviewUrl ? (
            <div className="previewBlock videoCompactPreviewBlock">
              <p>{t("previewGeneratedAudio")}</p>
              <audio controls src={video.uploadedAudioPreviewUrl} />
            </div>
          ) : null}
        </Field>
      ) : null}

      {video.audioSourceMode === "existing" ? (
        <Field label={t("selectExistingAudio")}>
          {video.generatedAudio.length ? (
            <div className="videoCompactGrid videoCompactGridTwo">
              <select
                className="input"
                id="existingAudio"
                value={video.selectedAudioPath}
                onChange={(event) => video.setSelectedAudioPath(event.target.value)}
              >
                <option value="">{t("selectAudioPlaceholder")}</option>
                {video.generatedAudio.map((audio) => (
                  <option key={audio.relativePath} value={audio.relativePath}>
                    {audio.relativePath}
                  </option>
                ))}
              </select>
              {selectedAudio ? <audio key={selectedAudio.relativePath} controls src={selectedAudio.url} /> : null}
            </div>
          ) : (
            <div className="emptyText videoCompactEmpty videoEmptyActionRow">
              <span>{t("noAudioResources")}</span>
              <Link className="button videoContextAction" to="/">
                <AppIcon name="mic" className="size-4" />
                {t("goCreateVoice")}
              </Link>
            </div>
          )}
        </Field>
      ) : null}
    </SectionCard>
  );
}

function VideoConfigCard({ video }: { video: VideoState }) {
  const { t } = useI18n();
  const backgroundAccept =
    video.backgroundType === "video"
      ? "video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
      : video.backgroundType === "gif"
        ? "image/gif,.gif"
        : "image/*";

  return (
    <SectionCard title={t("videoConfigTitle")} description={t("videoConfigDescription")}>
      <AudioInputSummary video={video} />

      <div className="grid md:grid-cols-2 gap-4">
        <Field label={t("backgroundType")} hint={t("backgroundLimitHelp")}>
          <select
            className="input"
            id="backgroundType"
            value={video.backgroundType}
            onChange={(event) =>
              video.setBackgroundType(event.target.value === "video" ? "video" : event.target.value === "gif" ? "gif" : "image")
            }
          >
            <option value="image">{t("backgroundTypeImage")}</option>
            <option value="gif">{t("backgroundTypeGif")}</option>
            <option value="video">{t("backgroundTypeVideo")}</option>
          </select>
        </Field>

        <Field label={t("backgroundFile")}>
          <input
            key={video.backgroundType}
            id="videoBackground"
            type="file"
            accept={backgroundAccept}
            onChange={(event) => video.setBackgroundFile(event.target.files?.[0] || null)}
          />
          {video.backgroundFile ? <small>{video.backgroundFile.name}</small> : null}
        </Field>
      </div>

      <BackgroundPreview video={video} />

      <BackgroundMusicCard video={video} />

      <div className="videoCompactGrid videoCompactGridThree">
        <TextInput label={t("videoFileName")} value={video.videoFileName} onChange={video.setVideoFileName} />
        <SelectInput
          label={t("videoAspectRatio")}
          value={video.aspectRatio}
          onChange={(aspectRatio) => video.setAspectRatio(aspectRatio === "9:16" ? "9:16" : "16:9")}
          options={[
            { label: t("aspectRatioLandscape"), value: "16:9" },
            { label: t("aspectRatioPortrait"), value: "9:16" },
          ]}
        />
        <SelectInput
          label={t("videoFitMode")}
          value={video.fitMode}
          onChange={(fitMode) => video.setFitMode(fitMode === "contain" ? "contain" : "cover")}
          options={[
            { label: t("fitModeCover"), value: "cover" },
            { label: t("fitModeContain"), value: "contain" },
          ]}
        />
      </div>

      <div className="formPrimaryActionBar">
        <button className="button formPrimaryAction" onClick={video.requestGenerateVideo} disabled={!video.canGenerateVideo}>
          <AppIcon name="video" className="size-4" />
          {video.videoLoading ? t("videoGenerating") : t("generateVideo")}
        </button>
      </div>
    </SectionCard>
  );
}


function BackgroundMusicCard({ video }: { video: VideoState }) {
  const { t } = useI18n();
  const selectedMusic = video.backgroundMusic.find((item) => item.relativePath === video.selectedBackgroundMusicPath);

  return (
    <div className="backgroundMusicCompactCard">
      <div className="backgroundMusicCompactHeader">
        <label className="checkboxLabel">
          <input
            type="checkbox"
            checked={video.backgroundMusicEnabled}
            onChange={(event) => video.setBackgroundMusicEnabled(event.target.checked)}
          />
          <span>
            <strong>{t("backgroundMusicTitle")}</strong>
            <small>{t("backgroundMusicDescription")}</small>
          </span>
        </label>

        <label className="btn-ghost cursor-pointer text-center">
          {video.backgroundMusicUploading ? t("backgroundMusicUploading") : t("uploadBackgroundMusic")}
          <input
            className="sr-only"
            type="file"
            accept="audio/wav,audio/mpeg,audio/mp4,audio/aac,audio/ogg,audio/opus,.wav,.mp3,.m4a,.aac,.ogg,.opus"
            disabled={video.backgroundMusicUploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.currentTarget.value = "";
              if (file) {
                void video.uploadBackgroundMusic(file);
              }
            }}
          />
        </label>
      </div>

      {video.backgroundMusicEnabled ? (
        <div className="backgroundMusicCompactBody">
          <Field label={t("selectBackgroundMusic")} hint={t("selectBackgroundMusicHelp")}>
            {video.backgroundMusic.length ? (
              <select
                className="input"
                id="backgroundMusic"
                value={video.selectedBackgroundMusicPath}
                onChange={(event) => video.setSelectedBackgroundMusicPath(event.target.value)}
              >
                <option value="">{t("noBackgroundMusic")}</option>
                {video.backgroundMusic.map((music) => (
                  <option key={music.relativePath} value={music.relativePath}>
                    {music.relativePath}
                  </option>
                ))}
              </select>
            ) : (
              <p className="emptyText videoCompactEmpty">{t("noBackgroundMusicResources")}</p>
            )}
          </Field>

          {selectedMusic ? <audio key={selectedMusic.relativePath} controls src={selectedMusic.url} /> : null}

          <div className="backgroundMusicControlGrid">
            <Field label={t("backgroundMusicVolume")} hint={t("backgroundMusicVolumeHelp")}>
              <input
                className="input"
                type="range"
                min={0}
                max={100}
                value={video.backgroundMusicVolume}
                onChange={(event) => video.setBackgroundMusicVolume(Number(event.target.value))}
              />
              <small>{video.backgroundMusicVolume}%</small>
            </Field>

            <Field label={t("backgroundMusicLoop")}>
              <label className="checkboxLabel backgroundMusicLoopInline">
                <input
                  type="checkbox"
                  checked={video.backgroundMusicLoop}
                  onChange={(event) => video.setBackgroundMusicLoop(event.target.checked)}
                />
                {t("backgroundMusicLoopHelp")}
              </label>
            </Field>

            <Field label={t("backgroundMusicFadeIn")}>
              <input
                className="input"
                type="number"
                min={0}
                max={30}
                step={0.5}
                value={video.backgroundMusicFadeIn}
                onChange={(event) => video.setBackgroundMusicFadeIn(Number(event.target.value))}
              />
            </Field>
            <Field label={t("backgroundMusicFadeOut")}>
              <input
                className="input"
                type="number"
                min={0}
                max={30}
                step={0.5}
                value={video.backgroundMusicFadeOut}
                onChange={(event) => video.setBackgroundMusicFadeOut(Number(event.target.value))}
              />
            </Field>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AudioInputSummary({ video }: { video: VideoState }) {
  const { t } = useI18n();
  const selectedAudio = video.generatedAudio.find((audio) => audio.relativePath === video.selectedAudioPath);
  const sourceLabel = video.audioSourceMode === "upload" ? video.uploadedAudioFile?.name || "--" : selectedAudio?.relativePath || video.selectedAudioPath || "--";

  return (
    <div className="stepSummary">
      <div>
        <strong>{t("voiceOutput")}</strong>
        <small>{t("voiceOutputHelp")}</small>
      </div>
      <span>{sourceLabel}</span>
    </div>
  );
}

function BackgroundPreview({ video }: { video: VideoState }) {
  const { t } = useI18n();

  if (!video.backgroundPreviewUrl) {
    return null;
  }

  return (
    <div className="backgroundPreview">
      <p>{t("backgroundPreview")}</p>
      {video.backgroundType === "image" ? <img src={video.backgroundPreviewUrl} alt={t("backgroundTypeImage")} /> : null}
      {video.backgroundType === "gif" ? <img src={video.backgroundPreviewUrl} alt={t("backgroundTypeGif")} /> : null}
      {video.backgroundType === "video" ? <video src={video.backgroundPreviewUrl} controls loop muted /> : null}
    </div>
  );
}

function VideoPreviewCard({ video }: { video: VideoState }) {
  const { t } = useI18n();

  return (
    <aside className="videoStudioPreviewColumn">
      <SectionCard title={t("videoPreviewTitle")} description={t("videoPreviewDescription")} sticky>
        {!video.previewVideo && !video.generatedVideos.length ? (
          <p className="emptyText">{t("noVideoResources")}</p>
        ) : (
          <div className="space-y-4">
            <Field label={t("generatedVideoPreview")}>
              <select
                className="input"
                id="generatedVideoPreview"
                value={video.previewVideo?.relativePath || ""}
                onChange={(event) => {
                  const selectedVideo = video.generatedVideos.find((item) => item.relativePath === event.target.value) || null;
                  video.setPreviewVideo(selectedVideo);
                }}
                disabled={video.videosLoading}
              >
                {video.generatedVideos.map((item) => (
                  <option key={item.relativePath} value={item.relativePath}>
                    {item.relativePath}
                  </option>
                ))}
              </select>
            </Field>

            {video.previewVideo ? (
              <>
                <video key={video.previewVideo.relativePath} className="videoPreview" controls preload="metadata" src={video.previewVideo.videoUrl} />
                <p className="fileName">
                  {t("createdVideo")} <strong>{video.previewVideo.relativePath}</strong>
                </p>
                {video.result?.audio.relativePath ? (
                  <p className="fileName">
                    {t("createdAudio")} <strong>{video.result.audio.relativePath}</strong>
                  </p>
                ) : null}
                <div className="previewActionStack">
                  <div className="previewSecondaryActions">
                    <a className="download" href={video.previewVideo.videoUrl} download={video.previewVideo.fileName}>
                      {t("downloadVideo")}
                    </a>
                    <a className="ghostLink" href={video.previewVideo.videoUrl} target="_blank" rel="noreferrer">
                      {t("openVideoFile")}
                    </a>
                  </div>
                  <Link className="button previewPrimaryAction" to="/youtube">
                    <AppIcon name="youtube" className="size-4" />
                    {t("goToYoutubeUpload")}
                  </Link>
                </div>
              </>
            ) : null}
          </div>
        )}
      </SectionCard>
    </aside>
  );
}
