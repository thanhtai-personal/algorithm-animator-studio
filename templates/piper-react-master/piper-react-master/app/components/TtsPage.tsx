import { Link } from "react-router";
import { useTtsGenerator } from "../hooks/useTtsGenerator";
import { useI18n } from "../i18n";
import { AppIcon, Field, PageHeader, StatusBadge } from "./AppHeader";
import { ConfigLockOverlay } from "./ConfigLockOverlay";
import { SpeechPreviewButton } from "./SpeechPreviewButton";
import { WebTextExtractor } from "./WebTextExtractor";

export function TtsPage() {
  const tts = useTtsGenerator();
  const { locale, t } = useI18n();
  const proVoiceLocked = tts.isPro && tts.proConfig !== null && !tts.proConfig.hasApiKey;
  const piperReady = tts.localRuntimeAccessGranted && tts.health?.piperExists;
  const localVoiceStatus = tts.loadingHealth && !tts.health ? "neutral" : piperReady ? "success" : "error";
  const localVoiceStatusText = tts.loadingHealth && !tts.health
    ? t("checkingLocalVoice")
    : piperReady
      ? t("piperReady")
      : tts.localRuntimeAccessGranted
        ? t("piperMissing")
        : t("piperLocalAccessRequired");

  return (
    <>
      <PageHeader
        title={t("ttsTitle")}
        description={t("ttsDescription")}
        badge={
          <StatusBadge variant={localVoiceStatus}>
            <span className="size-1.5 rounded-full bg-current" />
            {localVoiceStatusText}
          </StatusBadge>
        }
      />


      <div className="configGateScope">
        <section className="surface-card p-6 md:p-8 space-y-6">
        <ModelAndFileFields tts={tts} />
        {tts.isPro ? (
          <>
            <ProModeFields tts={tts} />
            <ProBillingNotice tts={tts} />
          </>
        ) : (
          <>
            <SentenceSilenceField tts={tts} />
            <SpeechRateField tts={tts} />
          </>
        )}
        <WebTextExtractor currentText={tts.text} onTextChange={tts.setText} />
        <TextField tts={tts} />

        <div className="generationActions">
          <SpeechPreviewButton
            text={tts.text}
            modelKey={tts.isPro ? undefined : tts.modelKey}
            sentenceSilence={tts.sentenceSilence}
            speechRate={tts.speechRate}
            disabled={tts.isPro || !tts.canUseSelectedModel}
            disabledMessage={tts.isPro ? t("piperPreviewProUnavailable") : t("piperPreviewUnavailable")}
          />
          <button className="button" onClick={tts.requestGenerate} disabled={!tts.canGenerate}>
            <AppIcon name="spark" className="size-4" />
            {tts.loading ? t("generatingFile") : t("generateFile")}
          </button>
          {!tts.localRuntimeAccessGranted ? (
            <Link className="btn-ghost" to="/health-check">
              {t("openHealthCheckTools")}
            </Link>
          ) : null}
        </div>

        {tts.message ? <div className="message">{tts.message}</div> : null}
        {tts.audioUrl ? <AudioPlayer tts={tts} /> : null}
        </section>
        {proVoiceLocked ? (
          <ConfigLockOverlay
            title={t("configGateProVoiceTitle")}
            description={t("configGateProVoiceDescription")}
            settingsTo="/settings?tab=elevenlabs"
          />
        ) : null}
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <Stat label={t("voiceModel")} value={tts.selectedModel?.label || "--"} />
        <Stat label={t("charactersPrefix")} value={tts.characterCount.toLocaleString(locale)} />
        <Stat label={t("outputFileName")} value={tts.fileName || "--"} />
      </div>

      {tts.showProConfirm ? <ProConfirmModal tts={tts} /> : null}
    </>
  );
}



type TtsState = ReturnType<typeof useTtsGenerator>;

function ModelAndFileFields({ tts }: { tts: TtsState }) {
  const { t } = useI18n();

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Field label={t("voiceModel")}>
        <select
          className="input"
          id="model"
          value={tts.modelKey}
          onChange={(event) => tts.changeModel(event.target.value)}
          disabled={tts.loadingModels && tts.models.length === 0}
        >
          {tts.models.length === 0 ? (
            <option value="">{t("loadingVoiceModels")}</option>
          ) : null}
          {tts.models.map((model) => (
            <option key={model.key} value={model.key} disabled={!model.available}>
              {model.label} {model.provider === "piper" && !model.available ? t("piperDisabledOptionSuffix") : ""}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t("outputFileName")} hint={t("fileNameHelp")}>
        <input
          id="fileName"
          className="input"
          value={tts.fileName}
          onChange={(event) => tts.setFileName(event.target.value)}
          placeholder={t("fileNamePlaceholder")}
        />
      </Field>
    </div>
  );
}

function ProModeFields({ tts }: { tts: TtsState }) {
  const { t } = useI18n();

  return (
    <Field label={t("proMode")}>
      <div className="radioGrid">
        {tts.proConfig?.models.map((mode) => (
          <label className="radioOption" key={mode.id}>
            <input
              type="radio"
              name="proMode"
              value={mode.id}
              checked={tts.proModeId === mode.id}
              onChange={(event) => tts.setProModeId(event.target.value)}
            />
            <span>
              <strong>{mode.label} PRO</strong>
              <small>
                {mode.languages}. {mode.latency}. {mode.qualityNote}
              </small>
            </span>
          </label>
        ))}
      </div>
    </Field>
  );
}


function ProBillingNotice({ tts }: { tts: TtsState }) {
  const model = tts.selectedProMode;
  const { locale, t } = useI18n();

  if (!model) {
    return null;
  }

  return (
    <div className="proBillingNotice">
      <strong>{t("proBillingWarningTitle")}</strong>
      <span>
        {t("proBillingWarningBody", {
          characters: tts.characterCount.toLocaleString(locale),
          cost: `$${tts.proEstimatedUsd.toFixed(4)}`,
        })}
      </span>
      <small>
        {model.creditRateLabel}. {tts.proConfig?.pricing.disclaimer || t("proBillingDisclaimer")}
      </small>
      {tts.exceedsProLimit ? (
        <small className="text-red-300">
          {t("proLimitExceeded", { limit: model.characterLimit.toLocaleString(locale) })}
        </small>
      ) : null}
    </div>
  );
}

function SentenceSilenceField({ tts }: { tts: TtsState }) {
  const { t } = useI18n();

  return (
    <Field label={t("sentenceSilence", { seconds: tts.sentenceSilence })} hint={t("sentenceSilenceHelp")}>
      <input
        id="sentenceSilence"
        className="range"
        type="range"
        min="0.5"
        max="3"
        step="0.1"
        value={tts.sentenceSilence}
        onChange={(event) => tts.setSentenceSilence(Number(event.target.value))}
      />
    </Field>
  );
}

function SpeechRateField({ tts }: { tts: TtsState }) {
  const { t } = useI18n();

  return (
    <Field label={t("speechRate", { rate: tts.speechRate.toFixed(2) })} hint={t("speechRateHelp")}>
      <input
        id="speechRate"
        className="range"
        type="range"
        min="0.5"
        max="1.4"
        step="0.05"
        value={tts.speechRate}
        onChange={(event) => tts.setSpeechRate(Number(event.target.value))}
      />
    </Field>
  );
}

function TextField({ tts }: { tts: TtsState }) {
  const { t } = useI18n();

  return (
    <Field
      label={t("narrationText")}
      hint={t("vietnameseTextHelp")}
      action={
        <div className="flex flex-wrap items-center gap-2">
          {tts.hasDeferredTextDraft ? (
            <button type="button" className="btn-ghost text-xs" onClick={tts.restoreDeferredTextDraft}>
              {t("restoreLargeTextDraft")}
            </button>
          ) : null}
          <button type="button" className="btn-ghost text-xs" onClick={tts.clearText}>
            {t("clearText")}
          </button>
        </div>
      }
    >
      {tts.hasDeferredTextDraft ? <div className="draftRestoreNotice">{t("largeTextDraftDeferred")}</div> : null}
      <textarea
        id="text"
        className="input font-mono text-sm leading-relaxed min-h-72"
        value={tts.text}
        onChange={(event) => tts.setText(event.target.value)}
        placeholder={t("textPlaceholder")}
      />
    </Field>
  );
}

function ProConfirmModal({ tts }: { tts: TtsState }) {
  const model = tts.selectedProMode;
  const { locale, t } = useI18n();

  if (!model) {
    return null;
  }

  return (
    <div className="modalOverlay" role="presentation">
      <div className="modalPanel" role="dialog" aria-modal="true" aria-labelledby="elevenConfirmTitle">
        <h2 id="elevenConfirmTitle" className="text-xl font-display font-semibold mb-4">
          {t("confirmProTitle")}
        </h2>
        <p>
          {t("voiceModelPrefix")} <strong>{model.label} PRO</strong>
        </p>
        <p>
          {t("charactersPrefix")} <strong>{tts.characterCount.toLocaleString(locale)}</strong>.
        </p>
        <p>
          {t("proPricePrefix")} <strong>{model.creditRateLabel}</strong>. {t("estimatePrefix")} {" "}
          <strong>${tts.proEstimatedUsd.toFixed(4)}</strong>.
        </p>
        {model.previewAudioUrl ? (
          <div className="previewBlock">
            <p>{t("previewMode")}</p>
            <audio controls src={model.previewAudioUrl} />
          </div>
        ) : null}
        <div className="proBillingNotice">
          <strong>{t("proBillingWarningTitle")}</strong>
          <span>{t("proBillingConfirmBody")}</span>
          <small>{tts.proConfig?.pricing.disclaimer || t("proBillingDisclaimer")}</small>
        </div>
        <p>{t("proConfirmationHelp")}</p>

        <div className="modalActions">
          <button type="button" className="btn-ghost" onClick={() => tts.setShowProConfirm(false)}>
            {t("cancel")}
          </button>
          <button type="button" className="button modalButton" onClick={tts.confirmProGenerate}>
            {t("confirmGenerate")}
          </button>
        </div>
      </div>
    </div>
  );
}

function AudioPlayer({ tts }: { tts: TtsState }) {
  const { t } = useI18n();

  return (
    <div className="player space-y-4">
      <h2 className="text-lg font-display font-semibold">{t("audioResult")}</h2>

      {tts.generatedRelativePath ? (
        <p className="fileName">
          {t("createdFile")} <strong>{tts.generatedRelativePath}</strong>
        </p>
      ) : null}

      <div className="previewBlock">
        <p>{t("previewGeneratedAudio")}</p>
        <audio controls src={tts.audioUrl} />
      </div>

      <div className="linkRow">
        <a className="download flex-1" href={tts.audioUrl} download={tts.generatedFileName || "audio"}>
          {t("downloadAudio")}
        </a>
        <Link className="button flex-1" to="/video">
          <AppIcon name="video" className="size-4" />
          {t("goToVideoStudio")}
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card p-5 min-w-0">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-display font-bold flex items-center gap-2 truncate">
        {value}
        <AppIcon name="spark" className="size-4 text-primary-glow shrink-0" />
      </div>
    </div>
  );
}
