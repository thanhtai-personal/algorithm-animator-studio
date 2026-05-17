import { useMemo, useState } from "react";
import { useWebTextExtractor } from "../hooks/useWebTextExtractor";
import { useI18n } from "../i18n";
import { AppIcon, Field } from "./AppHeader";

type WebTextExtractorProps = {
  currentText: string;
  onTextChange: (text: string) => void;
};

type VirtualItem = {
  id: string;
  title: string;
  subtitle: string;
  meta?: string;
  status?: "ok" | "error" | "neutral";
};

type VirtualListProps = {
  items: VirtualItem[];
  emptyLabel?: string;
  height?: number;
  rowHeight?: number;
};

const VIRTUAL_OVERSCAN = 6;

export function WebTextExtractor({ currentText, onTextChange }: WebTextExtractorProps) {
  const { locale, t } = useI18n();
  const extractor = useWebTextExtractor({ currentText, onTextChange });
  const isVi = locale.toLowerCase().startsWith("vi");

  const discoveredItems = useMemo<VirtualItem[]>(() => {
    return (extractor.linkResult?.links || []).map((link, index) => ({
      id: `${link.href}-${index}`,
      title: link.text || link.href,
      subtitle: link.href,
      meta: String(index + 1),
      status: "neutral",
    }));
  }, [extractor.linkResult]);

  const resultItems = useMemo<VirtualItem[]>(() => {
    return (extractor.result?.results || []).map((item, index) => ({
      id: `${item.url}-${index}`,
      title: item.title || item.url,
      subtitle: item.url,
      meta: item.ok ? item.characterCount.toLocaleString(locale) : item.error || t("extractFailure"),
      status: item.ok ? "ok" : "error",
    }));
  }, [extractor.result, locale, t]);

  return (
    <div className="webExtractor">
      <div className="webExtractorHeader">
        <div>
          <h3>{t("webExtractTitle")}</h3>
          <p>{t("webExtractDescription")}</p>
        </div>
        <span className="chip">{t("webExtractUrlCount", { count: extractor.urlCount })}</span>
      </div>

      <div className="webExtractorStage">
        <div className="webExtractorStageLabel">
          <div className="webExtractorStageCopy">
            <strong>{t("webExtractLinksTitle")}</strong>
            <small>{t("webExtractLinksDescription")}</small>
          </div>
        </div>

        <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-4">
          <Field label={t("webExtractSourcePageUrl")} hint={t("webExtractSourcePageHelp")}>
            <input
              className="input"
              value={extractor.linkPageUrl}
              onChange={(event) => extractor.setLinkPageUrl(event.target.value)}
              placeholder="https://example.com/table-of-contents"
            />
          </Field>

          <Field label={t("webExtractHrefSelector")} hint={t("webExtractHrefSelectorHelp")}>
            <input
              className="input"
              value={extractor.linkSelector}
              onChange={(event) => extractor.setLinkSelector(event.target.value)}
              placeholder="a[href], .chapter-list a"
            />
          </Field>
        </div>

        <div className="webExtractorActions compactActions">
          <button
            type="button"
            className="button secondaryButton"
            onClick={extractor.getUrls}
            disabled={!extractor.canGetUrls}
          >
            <AppIcon name="spark" className="size-4" />
            {extractor.linkLoading ? t("webExtractLinksLoading") : t("webExtractLinksButton")}
          </button>
          {extractor.linkMessage ? <span className="webExtractorMessage">{extractor.linkMessage}</span> : null}
        </div>

        {discoveredItems.length ? (
          <div className="webExtractorListFrame">
            <div className="webExtractorListHeader">
              <strong>{isVi ? "Danh sách URL đã phát hiện" : "Discovered URL list"}</strong>
              <span>{discoveredItems.length.toLocaleString(locale)} URL</span>
            </div>
            <VirtualWebExtractorList items={discoveredItems} height={240} rowHeight={78} />
          </div>
        ) : null}
      </div>

      <div className="webExtractorStage">
        <div className="webExtractorStageLabel">
          <div className="webExtractorStageCopy">
            <strong>{t("webExtractTextStepTitle")}</strong>
            <small>{t("webExtractTextStepDescription")}</small>
          </div>
        </div>

        <div className="grid md:grid-cols-[1.3fr_0.7fr] gap-4">
          <Field label={t("webExtractUrls")} hint={t("webExtractUrlsHelp")}>
            <textarea
              className="input compactTextarea"
              value={extractor.urlList}
              onChange={(event) => extractor.setUrlList(event.target.value)}
              placeholder={t("webExtractUrlsPlaceholder")}
            />
          </Field>

          <Field label={t("webExtractSelector")} hint={t("webExtractSelectorHelp")}>
            <input
              className="input"
              value={extractor.selector}
              onChange={(event) => extractor.setSelector(event.target.value)}
              placeholder="article, main, .chapter-content"
            />
            <label className="checkboxLabel mt-2">
              <input
                type="checkbox"
                checked={extractor.appendMode}
                onChange={(event) => extractor.setAppendMode(event.target.checked)}
              />
              {t("webExtractAppendMode")}
            </label>
          </Field>
        </div>
      </div>

      <div className="webExtractorActions">
        <button type="button" className="button secondaryButton" onClick={extractor.extract} disabled={!extractor.canExtract}>
          <AppIcon name="spark" className="size-4" />
          {extractor.loading ? t("webExtractLoading") : t("webExtractButton")}
        </button>
        {extractor.message ? <span className="webExtractorMessage">{extractor.message}</span> : null}
      </div>

      {extractor.progress.total > 0 ? (
        <div className="webExtractorProgressFrame">
          <div className="webExtractorProgressHeader">
            <strong>{isVi ? "Tiến trình lấy text" : "Extraction progress"}</strong>
            <span>
              {extractor.progress.processed.toLocaleString(locale)} / {extractor.progress.total.toLocaleString(locale)} URL
            </span>
          </div>
          <div className="webExtractorProgressBar" aria-hidden="true">
            <span style={{ width: `${extractor.progress.percent}%` }} />
          </div>
          <div className="webExtractorProgressMeta">
            <span>
              {isVi ? "Thành công" : "Success"}: {extractor.progress.success.toLocaleString(locale)}
            </span>
            <span>
              {isVi ? "Lỗi" : "Failed"}: {extractor.progress.failed.toLocaleString(locale)}
            </span>
          </div>
          {extractor.progress.currentUrl ? (
            <small className="webExtractorProgressCurrent">
              {isVi ? "Đang xử lý" : "Processing"}: {extractor.progress.currentUrl}
            </small>
          ) : null}
        </div>
      ) : null}

      {resultItems.length ? (
        <div className="webExtractorListFrame">
          <div className="webExtractorListHeader">
            <strong>{isVi ? "Kết quả lấy text" : "Extraction results"}</strong>
            <span>{resultItems.length.toLocaleString(locale)} URL</span>
          </div>
          <VirtualWebExtractorList items={resultItems} height={260} rowHeight={82} />
        </div>
      ) : null}
    </div>
  );
}

function VirtualWebExtractorList({ items, emptyLabel, height = 260, rowHeight = 82 }: VirtualListProps) {
  const [scrollTop, setScrollTop] = useState(0);

  if (!items.length) {
    return emptyLabel ? <div className="webExtractorListEmpty">{emptyLabel}</div> : null;
  }

  const totalHeight = items.length * rowHeight;
  const visibleCount = Math.ceil(height / rowHeight) + VIRTUAL_OVERSCAN * 2;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - VIRTUAL_OVERSCAN);
  const endIndex = Math.min(items.length, startIndex + visibleCount);
  const visibleItems = items.slice(startIndex, endIndex);
  const top = startIndex * rowHeight;

  return (
    <div
      className="webExtractorVirtualList"
      style={{ height }}
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
    >
      <div className="webExtractorVirtualSpacer" style={{ height: totalHeight }}>
        <div className="webExtractorVirtualItems" style={{ transform: `translateY(${top}px)` }}>
          {visibleItems.map((item) => (
            <div
              key={item.id}
              className={`webExtractorVirtualRow ${item.status === "ok" ? "ok" : ""} ${item.status === "error" ? "error" : ""}`}
              style={{ height: rowHeight - 8 }}
            >
              <div>
                <strong>{item.title}</strong>
                <small>{item.subtitle}</small>
              </div>
              {item.meta ? <span>{item.meta}</span> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
