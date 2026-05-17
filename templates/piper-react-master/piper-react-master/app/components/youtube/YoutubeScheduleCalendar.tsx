import { useEffect, useMemo, useState } from "react";
import { getResourceOverview, type GeneratedResource } from "../../api/resourceApi";
import {
  uploadGeneratedYoutubeVideo,
  uploadYoutubeVideo,
  updateYoutubeScheduledVideo,
  type YoutubeUploadResult,
} from "../../api/youtubeApi";
import { EMPTY_YOUTUBE_UPLOAD } from "../../constants/youtubeDefaults";
import { useI18n } from "../../i18n";
import { buildYoutubeUploadFormData } from "../../utils/youtubeFormData";
import { AppIcon, Field, SectionCard } from "../AppHeader";
import type { YoutubeState } from "../YoutubeUploadPanel";
import { Checkbox, SelectInput, TextArea, TextInput } from "./YoutubeFormControls";

const STORAGE_KEY = "kata.studio.youtubeSchedule.v1";
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const TIME_SLOTS = Array.from({ length: 18 }, (_, index) => 6 + index);
const VIDEO_PICKER_PAGE_SIZE = 6;
const VIDEO_SEARCH_DELAY_MS = 220;

type YoutubeCalendarItem = typeof EMPTY_YOUTUBE_UPLOAD & {
  id: string;
  scheduledAt: string;
  createdAtMs: number;
  updatedAtMs: number;
  sourceType: "generated" | "upload";
  sourceFileName?: string;
  sourceRelativePath?: string;
  youtubeVideoId?: string;
  youtubeUrl?: string;
  status: "scheduled" | "posted" | "failed";
  message?: string;
};

type DrawerState =
  | { type: "closed" }
  | { type: "create"; scheduledAt: string }
  | { type: "edit"; item: YoutubeCalendarItem }
  | { type: "view"; item: YoutubeCalendarItem }
  | { type: "list"; scheduledAt: string; items: YoutubeCalendarItem[] };

type ScheduleForm = typeof EMPTY_YOUTUBE_UPLOAD & {
  generatedRelativePath: string;
};

export function YoutubeScheduleCalendar({ youtube }: { youtube: YoutubeState }) {
  const { t, language } = useI18n();
  const [weekStartMs, setWeekStartMs] = useState(() => startOfLocalWeek(Date.now()));
  const [items, setItems] = useState<YoutubeCalendarItem[]>(() => readScheduleItems());
  const [videos, setVideos] = useState<GeneratedResource[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [drawer, setDrawer] = useState<DrawerState>({ type: "closed" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    writeScheduleItems(items);
  }, [items]);

  useEffect(() => {
    void loadVideos();
  }, []);

  async function loadVideos() {
    setVideosLoading(true);
    try {
      const overview = await getResourceOverview();
      const mergedVideos = [...overview.video];
      const currentGenerated = youtube.generatedVideo;

      if (currentGenerated?.relativePath && !mergedVideos.some((video) => video.relativePath === currentGenerated.relativePath)) {
        mergedVideos.unshift({
          kind: "video",
          fileName: currentGenerated.fileName || currentGenerated.relativePath.split("/").pop() || "generated-video.mp4",
          relativePath: currentGenerated.relativePath,
          url: currentGenerated.url,
          sizeBytes: 0,
          createdAtMs: Date.now(),
        });
      }

      setVideos(mergedVideos);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("youtubeCalendarVideoLoadError"));
    } finally {
      setVideosLoading(false);
    }
  }

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, index) => weekStartMs + index * DAY_MS),
    [weekStartMs]
  );

  const sortedItems = useMemo(
    () => [...items].sort((first, second) => new Date(first.scheduledAt).getTime() - new Date(second.scheduledAt).getTime()),
    [items]
  );

  function getItemsForSlot(dayMs: number, hour: number) {
    const slotStart = dayMs + hour * HOUR_MS;
    const slotEnd = slotStart + HOUR_MS;

    return sortedItems.filter((item) => {
      const itemMs = new Date(item.scheduledAt).getTime();
      return itemMs >= slotStart && itemMs < slotEnd;
    });
  }

  function openSlot(dayMs: number, hour: number) {
    const slotItems = getItemsForSlot(dayMs, hour);
    const scheduledAt = toDatetimeLocal(new Date(dayMs + hour * HOUR_MS));

    if (!slotItems.length) {
      setDrawer({ type: "create", scheduledAt });
      return;
    }

    if (slotItems.length === 1) {
      openItem(slotItems[0]);
      return;
    }

    setDrawer({ type: "list", scheduledAt, items: slotItems });
  }

  function openItem(item: YoutubeCalendarItem) {
    setDrawer(canEditItem(item) ? { type: "edit", item } : { type: "view", item });
  }

  function upsertItem(nextItem: YoutubeCalendarItem) {
    setItems((current) => {
      const exists = current.some((item) => item.id === nextItem.id);
      return exists
        ? current.map((item) => (item.id === nextItem.id ? nextItem : item))
        : [nextItem, ...current];
    });
  }

  return (
    <div className="youtubeCalendarPage">
      <SectionCard title={t("youtubeCalendarTitle")} description={t("youtubeCalendarDescription")}>
        <div className="youtubeCalendarToolbar">
          <div>
            <strong>{formatWeekRange(days[0], days[6], language)}</strong>
            <small>{t("youtubeCalendarToolbarHelp")}</small>
          </div>
          <div className="youtubeCalendarToolbarActions">
            <button type="button" className="btn-ghost" onClick={() => setWeekStartMs((current) => current - 7 * DAY_MS)}>
              {t("previousWeek")}
            </button>
            <button type="button" className="btn-ghost" onClick={() => setWeekStartMs(startOfLocalWeek(Date.now()))}>
              {t("thisWeek")}
            </button>
            <button type="button" className="btn-ghost" onClick={() => setWeekStartMs((current) => current + 7 * DAY_MS)}>
              {t("nextWeek")}
            </button>
          </div>
        </div>

        {message ? <div className="message">{message}</div> : null}

        <div className="youtubeCalendarGridFrame" style={{ position: "relative", minHeight: "22rem" }}>
          {videosLoading ? <CalendarLoadingOverlay label={t("processing")} /> : null}
          <div
            className="youtubeCalendarGrid youtubeCalendarDesktopGrid"
            style={{
              gridTemplateColumns: `4.25rem repeat(7, minmax(0, 1fr))`,
              opacity: videosLoading ? 0.58 : 1,
              transition: "opacity 180ms ease",
            }}
          >
            <div className="youtubeCalendarCorner" />
            {days.map((dayMs) => {
              const isToday = isSameLocalDay(dayMs, Date.now());

              return (
                <div key={dayMs} className={["youtubeCalendarDayHeader", isToday ? "isToday" : ""].filter(Boolean).join(" ")}>
                  <strong>{formatDayLabel(dayMs, language)}</strong>
                  <small>{formatDateLabel(dayMs, language)}</small>
                </div>
              );
            })}

            {TIME_SLOTS.map((hour) => (
              <TimeSlotRow
                key={hour}
                hour={hour}
                days={days}
                getItemsForSlot={getItemsForSlot}
                openSlot={openSlot}
                openItem={openItem}
              />
            ))}
          </div>

          <MobileCalendarDays
            days={days}
            language={language}
            getItemsForSlot={getItemsForSlot}
            openSlot={openSlot}
            openItem={openItem}
            loading={videosLoading}
          />
        </div>
      </SectionCard>

      <YoutubeScheduleDrawer
        drawer={drawer}
        setDrawer={setDrawer}
        videos={videos}
        videosLoading={videosLoading}
        refreshVideos={loadVideos}
        youtube={youtube}
        upsertItem={upsertItem}
      />
    </div>
  );
}

function TimeSlotRow({
  hour,
  days,
  getItemsForSlot,
  openSlot,
  openItem,
}: {
  hour: number;
  days: number[];
  getItemsForSlot: (dayMs: number, hour: number) => YoutubeCalendarItem[];
  openSlot: (dayMs: number, hour: number) => void;
  openItem: (item: YoutubeCalendarItem) => void;
}) {
  return (
    <>
      <div className="youtubeCalendarTimeLabel">{formatHour(hour)}</div>
      {days.map((dayMs) => {
        const slotItems = getItemsForSlot(dayMs, hour);
        const firstItem = slotItems[0];
        const isToday = isSameLocalDay(dayMs, Date.now());

        return (
          <button
            key={`${dayMs}-${hour}`}
            type="button"
            className={["youtubeCalendarSlot", slotItems.length ? "hasPosts" : "", isToday ? "isToday" : ""].filter(Boolean).join(" ")}
            onClick={() => openSlot(dayMs, hour)}
          >
            {firstItem ? (
              <span className="youtubeCalendarPostPill">
                <span>{firstItem.title || firstItem.sourceFileName || "YouTube video"}</span>
                {slotItems.length > 1 ? <strong>+{slotItems.length - 1}...</strong> : null}
              </span>
            ) : (
              <span className="youtubeCalendarEmptySlot">+</span>
            )}
          </button>
        );
      })}
    </>
  );
}

function MobileCalendarDays({
  days,
  language,
  getItemsForSlot,
  openSlot,
  openItem,
  loading,
}: {
  days: number[];
  language: string;
  getItemsForSlot: (dayMs: number, hour: number) => YoutubeCalendarItem[];
  openSlot: (dayMs: number, hour: number) => void;
  openItem: (item: YoutubeCalendarItem) => void;
  loading: boolean;
}) {
  return (
    <div className="youtubeCalendarMobileDays" aria-busy={loading}>
      {days.map((dayMs) => {
        const isToday = isSameLocalDay(dayMs, Date.now());

        return (
          <section key={dayMs} className={["youtubeCalendarMobileDay", isToday ? "isToday" : ""].filter(Boolean).join(" ")}>
            <header>
              <strong>{formatDayLabel(dayMs, language)}</strong>
              <small>{formatDateLabel(dayMs, language)}</small>
            </header>

            <div className="youtubeCalendarMobileSlots">
              {TIME_SLOTS.map((hour) => {
                const slotItems = getItemsForSlot(dayMs, hour);
                const firstItem = slotItems[0];

                return (
                  <button
                    key={`${dayMs}-${hour}`}
                    type="button"
                    className={["youtubeCalendarMobileSlot", slotItems.length ? "hasPosts" : ""].filter(Boolean).join(" ")}
                    onClick={() => openSlot(dayMs, hour)}
                  >
                    <span className="youtubeCalendarMobileTime">{formatHour(hour)}</span>
                    {firstItem ? (
                      <span className="youtubeCalendarMobilePost" onClick={(event) => { event.stopPropagation(); openItem(firstItem); }}>
                        <strong>{firstItem.title || firstItem.sourceFileName || "YouTube video"}</strong>
                        {slotItems.length > 1 ? <small>+{slotItems.length - 1}</small> : null}
                      </span>
                    ) : (
                      <span className="youtubeCalendarMobileAdd">+</span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function GeneratedVideoPicker({
  videos,
  selectedRelativePath,
  onSelect,
  videoFile,
  onVideoFileChange,
  loading,
  disabled,
  refreshVideos,
  primaryAction,
}: {
  videos: GeneratedResource[];
  selectedRelativePath: string;
  onSelect: (relativePath: string) => void;
  videoFile: File | null;
  onVideoFileChange: (file: File | null) => void;
  loading: boolean;
  disabled: boolean;
  refreshVideos: () => Promise<void>;
  primaryAction?: React.ReactNode;
}) {
  const { t, language } = useI18n();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [searchLoading, setSearchLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isBusy = loading || searchLoading || refreshing;

  useEffect(() => {
    setSearchLoading(true);
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim().toLocaleLowerCase());
      setPage(1);
      setSearchLoading(false);
    }, VIDEO_SEARCH_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [query]);

  const filteredVideos = useMemo(() => {
    if (!debouncedQuery) {
      return videos;
    }

    return videos.filter((video) => {
      const haystack = `${video.fileName} ${video.relativePath}`.toLocaleLowerCase();
      return haystack.includes(debouncedQuery);
    });
  }, [debouncedQuery, videos]);

  const pageCount = Math.max(1, Math.ceil(filteredVideos.length / VIDEO_PICKER_PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visibleVideos = filteredVideos.slice((safePage - 1) * VIDEO_PICKER_PAGE_SIZE, safePage * VIDEO_PICKER_PAGE_SIZE);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refreshVideos();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <section className="generatedVideoPickerFrame" aria-busy={isBusy}>
      <div className="generatedVideoPickerHeader">
        <div>
          <strong>{t("selectGeneratedVideo")}</strong>
          <small>{t("youtubeScheduleVideoSourceHint")}</small>
        </div>
        <button type="button" className="btn-ghost" onClick={handleRefresh} disabled={disabled || refreshing}>
          {refreshing ? t("processing") : t("refresh")}
        </button>
      </div>

      <div className="generatedVideoPickerSearchRow">
        <TextInput
          label={t("searchVideo")}
          value={query}
          onChange={setQuery}
          disabled={disabled}
        />
      </div>

      <div className="generatedVideoPickerListWrap">
        {isBusy ? <CalendarLoadingOverlay label={searchLoading ? t("searching") : t("processing")} /> : null}
        <div className="generatedVideoPickerList">
          {visibleVideos.length ? (
            visibleVideos.map((video) => {
              const selected = video.relativePath === selectedRelativePath && !videoFile;

              return (
                <button
                  key={video.relativePath}
                  type="button"
                  className={["generatedVideoPickerItem", selected ? "selected" : ""].filter(Boolean).join(" ")}
                  onClick={() => onSelect(video.relativePath)}
                  disabled={disabled || Boolean(videoFile)}
                >
                  <span>
                    <strong>{video.fileName}</strong>
                    <small>{video.relativePath}</small>
                  </span>
                  <span className="generatedVideoPickerMeta">
                    {formatDateTime(new Date(video.createdAtMs).toISOString())}
                    {video.sizeBytes ? ` · ${formatResourceSize(video.sizeBytes, language)}` : ""}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="generatedVideoPickerEmpty">{t("noGeneratedVideosFound")}</div>
          )}
        </div>
      </div>

      <div className="generatedVideoPickerFooter">
        <button type="button" className="btn-ghost" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={safePage <= 1 || isBusy}>
          {t("previousPage")}
        </button>
        <small>{t("paginationSummary", { page: safePage, pageCount })}</small>
        <button type="button" className="btn-ghost" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={safePage >= pageCount || isBusy}>
          {t("nextPage")}
        </button>
      </div>

      <div className="generatedVideoPickerManualUpload">
        <div>
          <strong>{t("manualVideoUpload")}</strong>
          <small>{videoFile ? videoFile.name : t("manualVideoUploadHint")}</small>
        </div>
        <label className={["button secondaryButton generatedVideoPickerFileButton", disabled ? "disabled" : ""].filter(Boolean).join(" ")}>
          <AppIcon name="video" className="size-4" />
          {videoFile ? t("replaceVideoFile") : t("chooseVideoFile")}
          <input
            type="file"
            accept="video/*"
            disabled={disabled}
            onChange={(event) => onVideoFileChange(event.target.files?.[0] || null)}
          />
        </label>
        {videoFile ? (
          <button type="button" className="btn-ghost" onClick={() => onVideoFileChange(null)} disabled={disabled}>
            {t("clearGeneratedVideoSelection")}
          </button>
        ) : null}
      </div>

      {primaryAction ? <div className="generatedVideoPickerAction">{primaryAction}</div> : null}
    </section>
  );
}

function YoutubeScheduleDrawer({
  drawer,
  setDrawer,
  videos,
  videosLoading,
  refreshVideos,
  youtube,
  upsertItem,
}: {
  drawer: DrawerState;
  setDrawer: (drawer: DrawerState) => void;
  videos: GeneratedResource[];
  videosLoading: boolean;
  refreshVideos: () => Promise<void>;
  youtube: YoutubeState;
  upsertItem: (item: YoutubeCalendarItem) => void;
}) {
  const { t } = useI18n();
  const [form, setForm] = useState<ScheduleForm>(() => createDefaultScheduleForm(""));
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const item = drawer.type === "edit" || drawer.type === "view" ? drawer.item : null;
  const readOnly = drawer.type === "view" || (item ? !canEditItem(item) : false);

  useEffect(() => {
    setMessage("");
    setVideoFile(null);

    if (drawer.type === "create") {
      setForm(createDefaultScheduleForm(drawer.scheduledAt, videos[0]?.relativePath || ""));
      return;
    }

    if (drawer.type === "edit" || drawer.type === "view") {
      setForm({
        title: drawer.item.title,
        description: drawer.item.description,
        tags: drawer.item.tags,
        categoryId: drawer.item.categoryId,
        privacyStatus: drawer.item.privacyStatus,
        playlistId: drawer.item.playlistId,
        publishAt: toDatetimeLocal(new Date(drawer.item.scheduledAt)),
        madeForKids: drawer.item.madeForKids,
        notifySubscribers: drawer.item.notifySubscribers,
        containsSyntheticMedia: drawer.item.containsSyntheticMedia,
        generatedRelativePath: drawer.item.sourceRelativePath || "",
      });
    }
  }, [drawer, videos]);

  if (drawer.type === "closed") {
    return null;
  }

  if (drawer.type === "list") {
    return (
      <RightDrawer title={t("youtubeSameSlotPosts")} onClose={() => setDrawer({ type: "closed" })}>
        <div className="youtubeDrawerList">
          {drawer.items.map((slotItem) => (
            <button
              key={slotItem.id}
              type="button"
              className="youtubeDrawerListItem"
              onClick={() => setDrawer(canEditItem(slotItem) ? { type: "edit", item: slotItem } : { type: "view", item: slotItem })}
            >
              <strong>{slotItem.title || slotItem.sourceFileName || t("untitledVideo")}</strong>
              <small>{formatDateTime(slotItem.scheduledAt)}</small>
              <span>{canEditItem(slotItem) ? t("editScheduledPost") : t("viewPostedPost")}</span>
            </button>
          ))}
        </div>
        <button type="button" className="button fullWidthButton" onClick={() => setDrawer({ type: "create", scheduledAt: drawer.scheduledAt })}>
          {t("createAnotherPostAtThisTime")}
        </button>
      </RightDrawer>
    );
  }

  const selectedGeneratedVideo = videos.find((video) => video.relativePath === form.generatedRelativePath);

  async function saveSchedule() {
    if (!youtube.hasRefreshToken || !youtube.refreshToken) {
      setMessage(t("youtubeNeedAuthBeforeSchedule"));
      return;
    }

    if (!form.title.trim()) {
      setMessage(t("youtubeTitleRequired"));
      return;
    }

    if (drawer.type === "create" && !videoFile && !selectedGeneratedVideo) {
      setMessage(t("youtubeSelectVideoForSchedule"));
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const publishAt = toUtcIsoString(form.publishAt);
      let result: YoutubeUploadResult | null = null;

      if (drawer.type === "create") {
        result = videoFile
          ? await uploadYoutubeVideo(buildYoutubeUploadFormData({
              uploadForm: { ...form, privacyStatus: "private", publishAt: form.publishAt },
              videoFile,
              refreshToken: youtube.refreshToken,
            }))
          : await uploadGeneratedYoutubeVideo({
              ...form,
              privacyStatus: "private",
              publishAt,
              refreshToken: youtube.refreshToken,
              fileName: selectedGeneratedVideo?.fileName || "generated-video.mp4",
              videoUrl: selectedGeneratedVideo?.url || "",
            });

        upsertItem({
          ...form,
          id: crypto.randomUUID(),
          privacyStatus: "private",
          scheduledAt: new Date(form.publishAt).toISOString(),
          createdAtMs: Date.now(),
          updatedAtMs: Date.now(),
          sourceType: videoFile ? "upload" : "generated",
          sourceFileName: videoFile?.name || selectedGeneratedVideo?.fileName,
          sourceRelativePath: videoFile ? undefined : selectedGeneratedVideo?.relativePath,
          youtubeVideoId: result.id,
          youtubeUrl: result.url,
          status: new Date(form.publishAt).getTime() > Date.now() ? "scheduled" : "posted",
          message: result.playlistWarning,
        });
        setMessage(t("youtubeScheduleSaved"));
        await refreshVideos();
        return;
      }

      if (drawer.type === "edit" && drawer.item.youtubeVideoId) {
        result = await updateYoutubeScheduledVideo(drawer.item.youtubeVideoId, {
          refreshToken: youtube.refreshToken,
          title: form.title,
          description: form.description,
          tags: form.tags,
          categoryId: form.categoryId,
          privacyStatus: "private",
          publishAt,
          madeForKids: form.madeForKids,
          notifySubscribers: form.notifySubscribers,
          containsSyntheticMedia: form.containsSyntheticMedia,
        });
      }

      if (drawer.type === "edit") {
        upsertItem({
          ...drawer.item,
          ...form,
          privacyStatus: "private",
          scheduledAt: new Date(form.publishAt).toISOString(),
          updatedAtMs: Date.now(),
          youtubeUrl: result?.url || drawer.item.youtubeUrl,
          status: new Date(form.publishAt).getTime() > Date.now() ? "scheduled" : "posted",
          message: result?.playlistWarning || drawer.item.message,
        });
        setMessage(t("youtubeScheduleUpdated"));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("youtubeScheduleSaveFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <RightDrawer
      title={drawer.type === "create" ? t("createScheduledPost") : readOnly ? t("viewScheduledPost") : t("editScheduledPost")}
      onClose={() => setDrawer({ type: "closed" })}
    >
      <div className="youtubeDrawerForm">
        <TextInput
          label={t("publishAt")}
          type="datetime-local"
          value={form.publishAt}
          onChange={(publishAt) => setForm((current) => ({ ...current, publishAt }))}
          disabled={readOnly}
        />

        {drawer.type !== "create" ? (
          <div className="stepSummary">
            <div>
              <strong>{item?.sourceFileName || item?.sourceRelativePath || t("videoFile")}</strong>
              <small>{item?.youtubeUrl || item?.sourceRelativePath || t("youtubeCalendarLocalRecord")}</small>
            </div>
            {item?.youtubeUrl ? (
              <a className="btn-ghost" href={item.youtubeUrl} target="_blank" rel="noreferrer">
                {t("openVideo")}
              </a>
            ) : null}
          </div>
        ) : null}

        <TextInput label={t("title")} value={form.title} onChange={(title) => setForm((current) => ({ ...current, title }))} disabled={readOnly} />
        <TextArea label={t("description")} value={form.description} onChange={(description) => setForm((current) => ({ ...current, description }))} disabled={readOnly} />
        <TextInput label={t("tags")} value={form.tags} onChange={(tags) => setForm((current) => ({ ...current, tags }))} disabled={readOnly} />

        <div className="grid md:grid-cols-2 gap-4">
          <SelectInput
            label={t("privacyStatus")}
            value="private"
            onChange={() => undefined}
            disabled
            options={[{ label: t("private"), value: "private" }]}
          />
          <TextInput label={t("categoryId")} value={form.categoryId} onChange={(categoryId) => setForm((current) => ({ ...current, categoryId }))} disabled={readOnly} />
        </div>

        <Field label={t("playlist")} hint={t("playlistHelp")}>
          <select
            className="input"
            value={form.playlistId}
            disabled={readOnly || youtube.playlistsLoading}
            onChange={(event) => setForm((current) => ({ ...current, playlistId: event.target.value }))}
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
          <Checkbox label={t("madeForKids")} checked={form.madeForKids} onChange={(madeForKids) => setForm((current) => ({ ...current, madeForKids }))} disabled={readOnly} />
          <Checkbox label={t("notifySubscribers")} checked={form.notifySubscribers} onChange={(notifySubscribers) => setForm((current) => ({ ...current, notifySubscribers }))} disabled={readOnly} />
          <Checkbox label={t("containsSyntheticMedia")} checked={form.containsSyntheticMedia} onChange={(containsSyntheticMedia) => setForm((current) => ({ ...current, containsSyntheticMedia }))} disabled={readOnly} />
        </div>

        {drawer.type === "create" ? (
          <GeneratedVideoPicker
            videos={videos}
            selectedRelativePath={form.generatedRelativePath}
            onSelect={(generatedRelativePath) => {
              setVideoFile(null);
              setForm((current) => ({ ...current, generatedRelativePath }));
            }}
            videoFile={videoFile}
            onVideoFileChange={(nextFile) => {
              setVideoFile(nextFile);
              if (nextFile) {
                setForm((current) => ({ ...current, generatedRelativePath: "" }));
              }
            }}
            loading={videosLoading}
            disabled={readOnly}
            refreshVideos={refreshVideos}
            primaryAction={
              !readOnly ? (
                <button type="button" className="button fullWidthButton" onClick={saveSchedule} disabled={loading}>
                  <AppIcon name="youtube" className="size-4" />
                  {loading ? t("processing") : t("scheduleYoutubePost")}
                </button>
              ) : null
            }
          />
        ) : null}

        {message ? <div className="message">{message}</div> : null}

        {!readOnly && drawer.type !== "create" ? (
          <button type="button" className="button fullWidthButton" onClick={saveSchedule} disabled={loading}>
            <AppIcon name="youtube" className="size-4" />
            {loading ? t("processing") : t("saveScheduledPost")}
          </button>
        ) : null}
      </div>
    </RightDrawer>
  );
}


function CalendarLoadingOverlay({ label }: { label: string }) {
  return (
    <div
      aria-live="polite"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 5,
        display: "grid",
        placeItems: "center",
        borderRadius: "1.25rem",
        background: "color-mix(in srgb, var(--background) 62%, transparent)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.75rem",
          borderRadius: "999px",
          border: "1px solid var(--border)",
          background: "var(--card)",
          padding: "0.85rem 1rem",
          color: "var(--foreground)",
          boxShadow: "0 1rem 2.5rem rgba(0, 0, 0, 0.22)",
          fontSize: "0.92rem",
          fontWeight: 700,
        }}
      >
        <span aria-hidden className="size-4 rounded-full border-2 border-muted-foreground/20 border-t-primary animate-spin" />
        {label}
      </div>
    </div>
  );
}

function RightDrawer({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const [closing, setClosing] = useState(false);

  function requestClose() {
    setClosing(true);
    window.setTimeout(onClose, 180);
  }

  return (
    <div className={["rightDrawerOverlay", closing ? "closing" : ""].filter(Boolean).join(" ")} role="dialog" aria-modal="true">
      <button type="button" className="rightDrawerBackdrop" aria-label="Close" onClick={requestClose} />
      <aside className="rightDrawerPanel">
        <div className="rightDrawerHeader">
          <h2>{title}</h2>
          <button type="button" className="btn-ghost" onClick={requestClose}>×</button>
        </div>
        <div className="rightDrawerBody">{children}</div>
      </aside>
    </div>
  );
}

function createDefaultScheduleForm(publishAt: string, generatedRelativePath = ""): ScheduleForm {
  return {
    ...EMPTY_YOUTUBE_UPLOAD,
    privacyStatus: "private",
    publishAt,
    generatedRelativePath,
  };
}

function readScheduleItems(): YoutubeCalendarItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data.filter(isScheduleItem) : [];
  } catch {
    return [];
  }
}

function writeScheduleItems(items: YoutubeCalendarItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 500)));
}

function isScheduleItem(value: unknown): value is YoutubeCalendarItem {
  return Boolean(value && typeof value === "object" && typeof (value as YoutubeCalendarItem).id === "string");
}

function canEditItem(item: YoutubeCalendarItem) {
  return item.status !== "failed" && new Date(item.scheduledAt).getTime() > Date.now();
}

function startOfLocalDay(value: number) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function startOfLocalWeek(value: number) {
  const date = new Date(startOfLocalDay(value));
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + mondayOffset);
  return date.getTime();
}

function formatHour(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function formatDayLabel(dayMs: number, language: string) {
  return new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", { weekday: "short" }).format(new Date(dayMs));
}

function formatDateLabel(dayMs: number, language: string) {
  return new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", { day: "2-digit", month: "2-digit" }).format(new Date(dayMs));
}

function formatWeekRange(startMs: number, endMs: number, language: string) {
  const locale = language === "vi" ? "vi-VN" : "en-US";
  const formatter = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" });
  return `${formatter.format(new Date(startMs))} - ${formatter.format(new Date(endMs))}`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}


function isSameLocalDay(firstMs: number, secondMs: number) {
  return startOfLocalDay(firstMs) === startOfLocalDay(secondMs);
}

function formatResourceSize(sizeBytes: number, language: string) {
  return new Intl.NumberFormat(language === "vi" ? "vi-VN" : "en-US", {
    maximumFractionDigits: sizeBytes >= 1024 * 1024 ? 1 : 0,
  }).format(sizeBytes >= 1024 * 1024 ? sizeBytes / 1024 / 1024 : sizeBytes / 1024) + (sizeBytes >= 1024 * 1024 ? " MB" : " KB");
}

function toDatetimeLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function toUtcIsoString(value: string) {
  return value ? new Date(value).toISOString() : "";
}
