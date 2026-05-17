import { SORT_ALGORITHMS, useAiSortShorts } from "../../hooks/useAiSortShorts";
import { useI18n } from "../../i18n";
import { PageLoading } from "../PageLoading";
import { Field, PageHeader, SectionCard, StatusBadge } from "../AppHeader";
import { ConfigLockOverlay } from "../ConfigLockOverlay";

export function AiSortShortsPage() {
  const shorts = useAiSortShorts();
  const { t } = useI18n();
  const apiLocked = shorts.config !== null && !shorts.config.configured;

  if (shorts.isInitializing) {
    return <PageLoading />;
  }

  return (
    <>
      <PageHeader
        title={t("shortsTitle")}
        description={t("shortsDescription")}
        badge={<StatusBadge variant={shorts.config?.configured ? "success" : "neutral"}>{shorts.config?.configured ? t("shortsApiReady") : t("shortsApiMissing")}</StatusBadge>}
      />

      <div className="configGateScope">
        <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] gap-6 items-start">
        <SectionCard title={t("shortsSetupTitle")} description={t("shortsSetupDescription")}>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label={t("shortsAlgorithm")}>
              <select className="input" value={shorts.algorithm} onChange={(event) => shorts.setAlgorithm(event.target.value as typeof shorts.algorithm)}>
                {SORT_ALGORITHMS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>

            {shorts.algorithm === "custom" ? (
              <Field label={t("shortsCustomAlgorithm")}>
                <input className="input" value={shorts.customAlgorithmName} onChange={(event) => shorts.setCustomAlgorithmName(event.target.value)} placeholder="Example: Cocktail Shaker Sort" />
              </Field>
            ) : (
              <Field label={t("videoFileName")}>
                <input className="input" value={shorts.videoFileName} onChange={(event) => shorts.setVideoFileName(event.target.value)} placeholder="bubble-sort-short" />
              </Field>
            )}

            <Field label={t("shortsItemCount")}>
              <input className="input" type="number" min={5} max={80} value={shorts.itemCount} onChange={(event) => shorts.setItemCount(Number(event.target.value))} />
            </Field>

            <Field label={t("shortsDuration")}>
              <input className="input" type="number" min={4} max={8} step={2} value={shorts.durationSeconds} onChange={(event) => shorts.setDurationSeconds(Number(event.target.value))} />
            </Field>
          </div>

          {shorts.algorithm === "custom" ? (
            <Field label={t("videoFileName")}>
              <input className="input" value={shorts.videoFileName} onChange={(event) => shorts.setVideoFileName(event.target.value)} placeholder="custom-sort-short" />
            </Field>
          ) : null}

          <Field label={t("shortsStyle")}>
            <textarea className="input compactTextarea" value={shorts.stylePrompt} onChange={(event) => shorts.setStylePrompt(event.target.value)} />
          </Field>

          <Field label={t("shortsPalette")}>
            <input className="input" value={shorts.palettePrompt} onChange={(event) => shorts.setPalettePrompt(event.target.value)} />
          </Field>

          <Field label={t("shortsExtraPrompt")}>
            <textarea className="input compactTextarea" value={shorts.extraPrompt} onChange={(event) => shorts.setExtraPrompt(event.target.value)} placeholder={t("shortsExtraPromptPlaceholder")} />
          </Field>

          <Field label={t("shortsPromptPreview")}>
            <pre className="promptPreview">{shorts.promptPreview}</pre>
          </Field>

          <div className="generationActions">
            <button className="button" type="button" onClick={shorts.generate} disabled={shorts.loading}>
              {shorts.loading ? t("shortsGenerating") : t("shortsGenerate")}
            </button>
          </div>

          {shorts.message ? <div className="message">{shorts.message}</div> : null}
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title={t("shortsPreviewTitle")} description={t("shortsPreviewDescription")}>
            {shorts.result ? (
              <>
                <video className="videoPreview shortsPreviewVideo" controls src={shorts.result.videoUrl} />
                <p className="fileName">
                  {t("createdVideo")} <strong>{shorts.result.relativePath}</strong>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <a className="download" href={shorts.result.videoUrl} download={shorts.result.fileName}>{t("downloadVideo")}</a>
                  <a className="ghostLink" href={shorts.result.videoUrl} target="_blank" rel="noreferrer">{t("openVideoFile")}</a>
                </div>
              </>
            ) : (
              <p className="emptyText">{t("shortsNoVideo")}</p>
            )}
          </SectionCard>

          <SectionCard title={t("shortsEditTitle")} description={t("shortsEditDescription")}>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label={t("videoAspectRatio")}>
                <select className="input" value={shorts.aspectRatio} onChange={(event) => shorts.setAspectRatio(event.target.value as typeof shorts.aspectRatio)}>
                  <option value="9:16">{t("aspectRatioPortrait")}</option>
                  <option value="16:9">{t("aspectRatioLandscape")}</option>
                </select>
              </Field>
              <Field label={t("videoFitMode")}>
                <select className="input" value={shorts.fitMode} onChange={(event) => shorts.setFitMode(event.target.value as typeof shorts.fitMode)}>
                  <option value="cover">{t("fitModeCover")}</option>
                  <option value="contain">{t("fitModeContain")}</option>
                </select>
              </Field>
              <Field label={t("shortsTrimStart")}>
                <input className="input" type="number" min={0} value={shorts.trimStartSeconds} onChange={(event) => shorts.setTrimStartSeconds(Number(event.target.value))} />
              </Field>
              <Field label={t("shortsMaxDuration")}>
                <input className="input" type="number" min={0} value={shorts.maxDurationSeconds} onChange={(event) => shorts.setMaxDurationSeconds(Number(event.target.value))} />
              </Field>
            </div>
            <button className="button secondaryButton" type="button" onClick={shorts.edit} disabled={!shorts.result || shorts.editing}>
              {shorts.editing ? t("shortsEditing") : t("shortsEdit")}
            </button>
          </SectionCard>
        </div>
        </div>
        {apiLocked ? (
          <ConfigLockOverlay
            title={t("configGateAiShortsTitle")}
            description={t("configGateAiShortsDescription")}
            settingsTo="/settings?tab=aiShorts"
          />
        ) : null}
      </div>
    </>
  );
}
