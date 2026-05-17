import { useMemo, useState } from "react";
import type { GeneratedResource, YoutubeUploadHistoryItem } from "../../api/resourceApi";
import { useResources, type ResourceTab } from "../../hooks/useResources";
import { useI18n } from "../../i18n";
import { AppIcon, PageHeader } from "../AppHeader";
import { ConfirmModal } from "../ConfirmModal";
import { PageLoading } from "../PageLoading";

const RESOURCE_PAGE_SIZE = 12;

type DeleteTarget = {
  kind: "audio" | "video" | "music";
  relativePaths: string[];
};

export function ResourcePage() {
  const resources = useResources();
  const { locale, t } = useI18n();
  const isInitialLoading = resources.isInitializing;

  if (isInitialLoading) {
    return <PageLoading />;
  }

  return (
    <>
      <PageHeader
        title={t("resourceTitle")}
        description={t("resourceDescription")}
        actions={
          <div className="flex flex-wrap gap-2">
            <label className="btn-ghost cursor-pointer">
              {t("uploadBackgroundMusic")}
              <input
                className="sr-only"
                type="file"
                accept="audio/wav,audio/mpeg,audio/mp4,audio/aac,audio/ogg,audio/opus,.wav,.mp3,.m4a,.aac,.ogg,.opus"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.currentTarget.value = "";
                  if (file) {
                    void resources.uploadBackgroundMusic(file);
                  }
                }}
              />
            </label>
            <button className="btn-ghost" onClick={resources.refresh} disabled={resources.loading}>
              {resources.loading ? t("loading") : t("refresh")}
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2 mb-6" role="tablist" aria-label={t("resourceTabs")}>
        <ResourceTabButton
          activeTab={resources.activeTab}
          count={resources.audio.length}
          label={t("audioResources")}
          tab="audio"
          setActiveTab={resources.setActiveTab}
        />
        <ResourceTabButton
          activeTab={resources.activeTab}
          count={resources.video.length}
          label={t("videoResources")}
          tab="video"
          setActiveTab={resources.setActiveTab}
        />
        <ResourceTabButton
          activeTab={resources.activeTab}
          count={resources.music.length}
          label={t("backgroundMusicResources")}
          tab="music"
          setActiveTab={resources.setActiveTab}
        />
        <ResourceTabButton
          activeTab={resources.activeTab}
          count={resources.uploads.length}
          label={t("uploadHistory")}
          tab="uploads"
          setActiveTab={resources.setActiveTab}
        />
      </div>

      <section className="surface-card p-4 md:p-6">
        {resources.activeTab === "audio" ? (
          <ResourceTable
            activePath={resources.activeAudioPath}
            emptyText={t("noAudioResources")}
            items={resources.audio}
            locale={locale}
            mediaKind="audio"
            openFolder={resources.openFolder}
            removeResources={resources.removeResources}
            setActivePath={resources.setActiveAudioPath}
          />
        ) : null}

        {resources.activeTab === "video" ? (
          <ResourceTable
            activePath={resources.activeVideoPath}
            emptyText={t("noVideoResources")}
            items={resources.video}
            locale={locale}
            mediaKind="video"
            openFolder={resources.openFolder}
            removeResources={resources.removeResources}
            setActivePath={resources.setActiveVideoPath}
          />
        ) : null}

        {resources.activeTab === "music" ? (
          <ResourceTable
            activePath={resources.activeMusicPath}
            emptyText={t("noBackgroundMusicResources")}
            items={resources.music}
            locale={locale}
            mediaKind="music"
            openFolder={resources.openFolder}
            removeResources={resources.removeResources}
            setActivePath={resources.setActiveMusicPath}
          />
        ) : null}

        {resources.activeTab === "uploads" ? (
          <UploadHistoryTable emptyText={t("noUploadHistory")} items={resources.uploads} locale={locale} />
        ) : null}

        {resources.message ? <div className="message">{resources.message}</div> : null}
      </section>
    </>
  );
}

function ResourceTabButton(props: {
  activeTab: ResourceTab;
  count: number;
  label: string;
  tab: ResourceTab;
  setActiveTab: (tab: ResourceTab) => void;
}) {
  const active = props.activeTab === props.tab;

  return (
    <button
      className={[
        "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border",
        active
          ? "bg-foreground text-background border-foreground shadow-glow"
          : "border-border text-muted-foreground hover:text-foreground hover:bg-accent",
      ].join(" ")}
      onClick={() => props.setActiveTab(props.tab)}
      role="tab"
      type="button"
    >
      <AppIcon name={props.tab === "uploads" ? "youtube" : props.tab === "video" ? "video" : "folder"} className="size-4" />
      {props.label}
      <span className={["text-xs px-1.5 py-0.5 rounded-md", active ? "bg-background/20" : "bg-accent"].join(" ")}>
        {props.count}
      </span>
    </button>
  );
}

function ResourceTable(props: {
  activePath: string;
  emptyText: string;
  items: GeneratedResource[];
  locale: string;
  mediaKind: "audio" | "video" | "music";
  openFolder: (kind: "audio" | "video" | "music", relativePath: string) => Promise<void>;
  removeResources: (kind: "audio" | "video" | "music", relativePaths: string[]) => Promise<void>;
  setActivePath: (path: string) => void;
}) {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const pageCount = Math.max(1, Math.ceil(props.items.length / RESOURCE_PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * RESOURCE_PAGE_SIZE;
    return props.items.slice(start, start + RESOURCE_PAGE_SIZE);
  }, [props.items, safePage]);

  if (!props.items.length) {
    return <p className="emptyText">{props.emptyText}</p>;
  }

  const activeItem =
    props.items.find((item) => item.relativePath === props.activePath) || props.items[0];
  const selectedOnPage = pageItems.filter((item) => selectedPaths.includes(item.relativePath));
  const allPageSelected = pageItems.length > 0 && selectedOnPage.length === pageItems.length;

  function toggleOne(relativePath: string) {
    setSelectedPaths((current) =>
      current.includes(relativePath)
        ? current.filter((path) => path !== relativePath)
        : [...current, relativePath]
    );
  }

  function togglePage() {
    const pagePaths = pageItems.map((item) => item.relativePath);
    setSelectedPaths((current) => {
      if (pagePaths.every((path) => current.includes(path))) {
        return current.filter((path) => !pagePaths.includes(path));
      }
      return Array.from(new Set([...current, ...pagePaths]));
    });
  }

  async function confirmDelete() {
    if (!deleteTarget?.relativePaths.length) {
      return;
    }

    await props.removeResources(deleteTarget.kind, deleteTarget.relativePaths);
    setSelectedPaths((current) => current.filter((path) => !deleteTarget.relativePaths.includes(path)));
    setDeleteTarget(null);
  }

  return (
    <div className="resourceLayout">
      <div className="resourceListPanel">
        <div className="resourceToolbar">
          <label className="checkboxLabel">
            <input type="checkbox" checked={allPageSelected} onChange={togglePage} />
            {t("resourceSelectPage")}
          </label>
          <div className="resourceToolbarActions">
            <span className="text-xs text-muted-foreground">
              {t("resourceSelectedCount", { count: selectedPaths.length })}
            </span>
            <button
              className="btn-ghost dangerButton"
              type="button"
              disabled={!selectedPaths.length}
              onClick={() => setDeleteTarget({ kind: props.mediaKind, relativePaths: selectedPaths })}
            >
              {t("deleteSelectedResources")}
            </button>
          </div>
        </div>

        <div className="resourceList">
          {pageItems.map((item) => {
            const checked = selectedPaths.includes(item.relativePath);
            return (
              <div key={item.relativePath} className={item.relativePath === activeItem.relativePath ? "resourceRow active" : "resourceRow"}>
                <input
                  type="checkbox"
                  checked={checked}
                  aria-label={t("resourceSelectOne")}
                  onChange={() => toggleOne(item.relativePath)}
                  onClick={(event) => event.stopPropagation()}
                />
                <button className="resourceRowButton" onClick={() => props.setActivePath(item.relativePath)} type="button">
                  <span className="min-w-0">
                    <strong>{item.fileName}</strong>
                    <small>{item.relativePath}</small>
                  </span>
                  <span className="hidden sm:block text-xs text-right">{formatDate(item.createdAtMs, props.locale)}</span>
                  <span className="text-xs text-primary-glow font-medium text-right">{formatBytes(item.sizeBytes)}</span>
                </button>
              </div>
            );
          })}
        </div>

        <div className="paginationBar">
          <button className="btn-ghost" type="button" disabled={safePage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
            {t("previousPage")}
          </button>
          <span>{t("paginationSummary", { page: safePage, pageCount })}</span>
          <button className="btn-ghost" type="button" disabled={safePage >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>
            {t("nextPage")}
          </button>
        </div>
      </div>

      <aside className="resourcePreview lg:sticky lg:top-24 space-y-4">
        <div>
          <h2 className="text-lg font-display font-semibold">{t("preview")}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t("resourcePath")}</p>
        </div>
        {props.mediaKind === "video" ? (
          <video key={activeItem.relativePath} className="videoPreview" controls preload="metadata" src={activeItem.url} />
        ) : (
          <audio key={activeItem.relativePath} controls src={activeItem.url} />
        )}
        <p className="fileName">
          {t("resourcePath")} <strong>{activeItem.relativePath}</strong>
        </p>
        <div className="grid grid-cols-2 gap-2">
          <a className="download" href={activeItem.url} download={activeItem.fileName}>
            {t("download")}
          </a>
          <a className="ghostLink" href={activeItem.url} target="_blank" rel="noreferrer">
            {t("openFile")}
          </a>
        </div>
        <button className="btn-ghost fullWidthButton" onClick={() => void props.openFolder(activeItem.kind, activeItem.relativePath)} type="button">
          {t("openContainingFolder")}
        </button>
        <button
          className="btn-ghost dangerButton fullWidthButton"
          onClick={() => setDeleteTarget({ kind: activeItem.kind, relativePaths: [activeItem.relativePath] })}
          type="button"
        >
          {t("deleteResource")}
        </button>
      </aside>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title={t("deleteResourceModalTitle")}
        description={
          <>
            <p>{t("deleteResourceModalBody", { count: deleteTarget?.relativePaths.length || 0 })}</p>
            {deleteTarget?.relativePaths.slice(0, 4).map((path) => (
              <code className="modalFilePath" key={path}>{path}</code>
            ))}
          </>
        }
        cancelLabel={t("cancel")}
        confirmLabel={t("confirmDelete")}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}

function UploadHistoryTable(props: {
  emptyText: string;
  items: YoutubeUploadHistoryItem[];
  locale: string;
}) {
  const { t } = useI18n();

  if (!props.items.length) {
    return <p className="emptyText">{props.emptyText}</p>;
  }

  return (
    <div className="uploadHistory">
      {props.items.map((item) => (
        <div className="uploadHistoryRow" key={item.id}>
          <div>
            <span className={item.status === "success" ? "badge ok" : "badge error"}>
              {item.status === "success" ? t("uploadSuccess") : t("uploadFailure")}
            </span>
          </div>
          <div>
            <strong>{item.title || item.sourceFileName || item.sourceRelativePath || t("untitled")}</strong>
            <small>{formatDate(item.attemptedAtMs, props.locale)}</small>
            <small>
              {t("source")} {item.source === "generated-video" ? t("generatedVideoSource") : t("browserUploadSource")}
              {item.sourceRelativePath ? ` - ${item.sourceRelativePath}` : ""}
            </small>
            {item.message ? <p className="text-sm text-muted-foreground mt-1">{item.message}</p> : null}
          </div>
          <div>
            {item.youtubeUrl ? (
              <a className="ghostLink" href={item.youtubeUrl} target="_blank" rel="noreferrer">
                {t("openVideo")}
              </a>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDate(value: number, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

function formatBytes(value: number) {
  if (!value) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}
