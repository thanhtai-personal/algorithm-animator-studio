import { useEffect, useState } from "react";
import {
  extractLinksFromWeb,
  extractTextFromWeb,
  type ExtractedTextItem,
  type ExtractLinksResponse,
  type ExtractTextResponse,
} from "../api/webExtractApi";
import { useI18n } from "../i18n";
import { readBooleanDraft, readPersistedDraft, readStringDraft, savePersistedDraft } from "../utils/persistedDrafts";

const DEFAULT_SELECTOR = "article, main, .content, .chapter-content, body";
const DEFAULT_LINK_SELECTOR = "a[href]";
const CLIENT_POLITE_DELAY_MS = 1200;

type ExtractProgress = {
  total: number;
  processed: number;
  success: number;
  failed: number;
  currentUrl: string;
  percent: number;
};

const EMPTY_PROGRESS: ExtractProgress = {
  total: 0,
  processed: 0,
  success: 0,
  failed: 0,
  currentUrl: "",
  percent: 0,
};

type WebExtractPersistedDraft = {
  linkPageUrl: string;
  linkSelector: string;
  urlList: string;
  selector: string;
  appendMode: boolean;
};

export function useWebTextExtractor(params: {
  currentText: string;
  onTextChange: (text: string) => void;
}) {
  const { t } = useI18n();
  const draft = readPersistedDraft<WebExtractPersistedDraft>("webExtract");
  const [linkPageUrl, setLinkPageUrl] = useState(() => readStringDraft(draft.linkPageUrl, ""));
  const [linkSelector, setLinkSelector] = useState(() => readStringDraft(draft.linkSelector, DEFAULT_LINK_SELECTOR));
  const [urlList, setUrlList] = useState(() => readStringDraft(draft.urlList, ""));
  const [selector, setSelector] = useState(() => readStringDraft(draft.selector, DEFAULT_SELECTOR));
  const [appendMode, setAppendMode] = useState(() => readBooleanDraft(draft.appendMode, false));
  const [loading, setLoading] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [linkMessage, setLinkMessage] = useState("");
  const [result, setResult] = useState<ExtractTextResponse | null>(null);
  const [linkResult, setLinkResult] = useState<ExtractLinksResponse | null>(null);
  const [progress, setProgress] = useState<ExtractProgress>(EMPTY_PROGRESS);

  useEffect(() => {
    savePersistedDraft("webExtract", {
      linkPageUrl,
      linkSelector,
      urlList,
      selector,
      appendMode,
    });
  }, [linkPageUrl, linkSelector, urlList, selector, appendMode]);

  const urls = parseUrls(urlList);
  const canExtract = Boolean(urls.length) && Boolean(selector.trim()) && !loading;
  const canGetUrls = Boolean(linkPageUrl.trim()) && Boolean(linkSelector.trim()) && !linkLoading;

  async function getUrls() {
    if (!canGetUrls) {
      setLinkMessage(t("webExtractLinksMissingInput"));
      return;
    }

    setLinkLoading(true);
    setLinkMessage("");
    setLinkResult(null);

    try {
      const nextResult = await extractLinksFromWeb({
        url: linkPageUrl.trim(),
        selector: linkSelector.trim(),
      });
      setLinkResult(nextResult);

      if (!nextResult.links.length) {
        setLinkMessage(t("webExtractLinksNoLinks"));
        return;
      }

      setUrlList(nextResult.links.map((link) => link.href).join("\n"));
      setLinkMessage(t("webExtractLinksSuccess", { count: nextResult.count }));
    } catch (error) {
      setLinkMessage(error instanceof Error ? error.message : t("webExtractLinksFailure"));
    } finally {
      setLinkLoading(false);
    }
  }

  async function extract() {
    if (!canExtract) {
      setMessage(t("extractMissingInput"));
      return;
    }

    setLoading(true);
    setMessage("");
    setResult(null);
    setProgress({ ...EMPTY_PROGRESS, total: urls.length });

    const extractedItems: ExtractedTextItem[] = [];
    const extractedTextParts: string[] = [];
    let success = 0;
    let failed = 0;
    let lastError = "";

    try {
      for (let index = 0; index < urls.length; index += 1) {
        const url = urls[index];
        setProgress(buildProgress(urls.length, index, success, failed, url));

        try {
          const itemResult = await extractTextFromWeb({ urls: [url], selector: selector.trim() });
          const item = itemResult.results[0];

          if (item) {
            extractedItems.push(item);
            if (item.ok && item.text.trim()) {
              extractedTextParts.push(item.text.trim());
              success += 1;
            } else {
              failed += 1;
            }
          } else {
            extractedItems.push(buildFailedItem(url, t("extractNoText")));
            failed += 1;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : t("extractFailure");
          lastError = errorMessage;
          extractedItems.push(buildFailedItem(url, errorMessage));
          failed += 1;
        }

        setProgress(buildProgress(urls.length, index + 1, success, failed, index + 1 < urls.length ? urls[index + 1] : ""));

        if (index < urls.length - 1) {
          await sleep(CLIENT_POLITE_DELAY_MS);
        }
      }

      const combinedText = extractedTextParts.join("\n\n");
      const characterCount = combinedText.length;
      const nextResult: ExtractTextResponse = {
        ok: true,
        selector: selector.trim(),
        combinedText,
        characterCount,
        results: extractedItems,
      };
      setResult(nextResult);

      if (combinedText.trim()) {
        params.onTextChange(applyText(params.currentText, combinedText.trim()));
        setMessage(
          appendMode
            ? t("extractAppendSuccess", { count: characterCount })
            : t("extractReplaceSuccess", { count: characterCount })
        );
      } else {
        setMessage(lastError || t("extractNoText"));
      }
    } finally {
      setLoading(false);
    }
  }

  function applyText(currentText: string, extractedText: string) {
    if (!appendMode || !currentText.trim()) {
      return extractedText;
    }

    return `${currentText.trim()}\n\n${extractedText}`;
  }

  return {
    appendMode,
    canExtract,
    canGetUrls,
    extract,
    getUrls,
    linkLoading,
    linkMessage,
    linkPageUrl,
    linkResult,
    linkSelector,
    loading,
    message,
    progress,
    result,
    selector,
    setAppendMode,
    setLinkMessage,
    setLinkPageUrl,
    setLinkSelector,
    setMessage,
    setSelector,
    setUrlList,
    urlCount: urls.length,
    urlList,
  };
}

function parseUrls(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

function buildProgress(
  total: number,
  processed: number,
  success: number,
  failed: number,
  currentUrl: string
): ExtractProgress {
  return {
    total,
    processed,
    success,
    failed,
    currentUrl,
    percent: total ? Math.min(100, Math.round((processed / total) * 100)) : 0,
  };
}

function buildFailedItem(url: string, error: string): ExtractedTextItem {
  return {
    ok: false,
    url,
    text: "",
    characterCount: 0,
    error,
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
