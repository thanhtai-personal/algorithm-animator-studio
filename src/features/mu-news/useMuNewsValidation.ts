import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { validateMuNewsItem } from "./muNewsApi";
import type { MuNewsItem, MuNewsItemValidation, MuNewsStepId } from "./types";

type ValidationById = Record<string, MuNewsItemValidation>;

type Params = {
  selectedItems: MuNewsItem[];
  setSelectedIds: Dispatch<SetStateAction<string[]>>;
  setActiveStep: (step: MuNewsStepId) => void;
  setMessage: (message: string) => void;
};

export function useMuNewsValidation({ selectedItems, setSelectedIds, setActiveStep, setMessage }: Params) {
  const [newsValidationById, setNewsValidationById] = useState<ValidationById>({});
  const [filteringNews, setFilteringNews] = useState(false);

  const selectedNewsValidated = useMemo(
    () => selectedItems.length > 0 && selectedItems.every((item) => (
      newsValidationById[item.id]?.status === "valid" && Boolean(newsValidationById[item.id]?.articleContent?.trim())
    )),
    [newsValidationById, selectedItems]
  );

  const invalidNewsCount = useMemo(
    () => Object.values(newsValidationById).filter((item) => item.status === "invalid" || item.status === "error").length,
    [newsValidationById]
  );

  async function filterSelectedNews() {
    if (!selectedItems.length || filteringNews) return;
    setFilteringNews(true);
    setMessage("");

    let validCount = 0;
    let invalidCount = 0;
    const queue = [...selectedItems];

    for (const item of queue) {
      setNewsValidationById((state) => ({
        ...state,
        [item.id]: { status: "loading", message: "Đang tải chi tiết bài viết..." },
      }));

      try {
        const result = await validateMuNewsItem({ item });
        const status = result.valid ? "valid" : "invalid";
        if (result.valid) validCount += 1;
        else {
          invalidCount += 1;
          setSelectedIds((ids) => ids.filter((id) => id !== item.id));
        }
        setNewsValidationById((state) => ({
          ...state,
          [item.id]: {
            status,
            message: result.message,
            detailPublishedAt: result.detailPublishedAt,
            resolvedUrl: result.resolvedUrl,
            articleContent: result.articleContent,
            checkedAt: new Date().toISOString(),
          },
        }));
      } catch (error) {
        invalidCount += 1;
        setSelectedIds((ids) => ids.filter((id) => id !== item.id));
        setNewsValidationById((state) => ({
          ...state,
          [item.id]: {
            status: "error",
            message: error instanceof Error ? error.message : "Không kiểm tra được bài viết.",
            checkedAt: new Date().toISOString(),
          },
        }));
      }
    }

    setFilteringNews(false);
    setMessage(`Đã lọc ${queue.length} tin: ${validCount} hợp lệ, ${invalidCount} bị bỏ chọn.`);
    if (validCount > 0) setActiveStep("filter");
  }

  function resetNewsValidation() {
    setNewsValidationById({});
  }

  function clearNewsValidationForItem(id: string) {
    setNewsValidationById((state) => {
      const next = { ...state };
      delete next[id];
      return next;
    });
  }

  return {
    newsValidationById,
    filteringNews,
    selectedNewsValidated,
    invalidNewsCount,
    filterSelectedNews,
    resetNewsValidation,
    clearNewsValidationForItem,
  };
}
