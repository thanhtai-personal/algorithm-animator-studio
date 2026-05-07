"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Heart, PlayCircle } from "lucide-react";
import { observer } from "mobx-react-lite";
import type { AppLocale } from "@/constants/locale";
import { useShowroomProductDetailPage } from "@/features/showroom/hooks/useShowroomProductDetailPage";
import type { ShowroomThemeVariant } from "@/features/showroom/utils/showroomTheme";
import { resolveShowroomThemeVariant } from "@/features/showroom/utils/showroomTheme";
import { cn } from "@/utils/className";
import { formatMoney } from "@/utils/format/money";

interface ShowroomProductDetailPageProps {
  locale: AppLocale;
  productId: string;
  showroomSlug?: string | null;
  branchSlug?: string | null;
  shopDomain?: string | null;
}

interface ShowroomThemeSurfaceClasses {
  pageClass: string;
  panelClass: string;
}

type ShowroomDetailMediaItem =
  | {
      type: "image";
      id: string;
      src: string;
      alt: string;
    }
  | {
      type: "video";
      id: string;
      embedUrl: string;
      title: string;
      thumbnailUrl: string | null;
    };

const SHOWROOM_THEME_SURFACE_CLASSES: Record<ShowroomThemeVariant, ShowroomThemeSurfaceClasses> = {
  default: {
    pageClass: "bg-gradient-background",
    panelClass: "border-border bg-card shadow-sm",
  },
  charm: {
    pageClass:
      "bg-[radial-gradient(circle_at_18%_8%,hsl(var(--primary)/0.2),transparent_52%),radial-gradient(circle_at_85%_12%,hsl(var(--accent)/0.18),transparent_42%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--background)))]",
    panelClass:
      "border-[hsl(var(--border)/0.75)] bg-[hsl(var(--card)/0.95)] shadow-[0_16px_38px_-30px_hsl(var(--primary)/0.32)]",
  },
  modern: {
    pageClass:
      "bg-[radial-gradient(circle_at_26%_7%,hsl(var(--secondary)/0.22),transparent_52%),radial-gradient(circle_at_80%_18%,hsl(var(--primary)/0.16),transparent_44%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--background)))]",
    panelClass:
      "border-[hsl(var(--border)/0.75)] bg-[hsl(var(--card)/0.95)] shadow-[0_16px_36px_-30px_hsl(var(--primary)/0.3)]",
  },
  showcase3d: {
    pageClass:
      "bg-[radial-gradient(circle_at_10%_8%,hsl(var(--kata-primary)/0.14),transparent_44%),linear-gradient(180deg,hsl(var(--kata-background)),hsl(var(--kata-background)))]",
    panelClass:
      "border-[hsl(var(--kata-border)/0.55)] bg-[hsl(var(--kata-card)/0.88)] shadow-[0_18px_42px_-32px_hsl(var(--kata-primary)/0.36)] backdrop-blur-xl",
  },
};

function hasHtmlMarkup(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function sanitizeRichTextHtml(value: string): string {
  if (typeof window === "undefined") {
    return value;
  }

  const parser = new DOMParser();
  const documentNode = parser.parseFromString(value, "text/html");

  documentNode.querySelectorAll("script, style, iframe, object, embed, link, meta").forEach((node) => {
    node.remove();
  });

  documentNode.querySelectorAll("*").forEach((element) => {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const normalizedValue = attribute.value.trim().toLowerCase();

      if (name.startsWith("on")) {
        element.removeAttribute(attribute.name);
        continue;
      }

      if ((name === "src" || name === "href") && normalizedValue.startsWith("javascript:")) {
        element.removeAttribute(attribute.name);
      }
    }
  });

  return documentNode.body.innerHTML;
}

function resolveYouTubeThumbnailUrl(embedUrl: string): string | null {
  try {
    const parsed = new URL(embedUrl);
    const pathChunks = parsed.pathname.split("/").filter(Boolean);
    const videoId = pathChunks[pathChunks.length - 1]?.trim() ?? "";
    if (!videoId) return null;
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  } catch {
    return null;
  }
}

function withYouTubeAutoplay(embedUrl: string): string {
  try {
    const parsed = new URL(embedUrl);
    parsed.searchParams.set("autoplay", "1");
    parsed.searchParams.set("rel", "0");
    return parsed.toString();
  } catch {
    return embedUrl;
  }
}

export const ShowroomProductDetailPage = observer(function ShowroomProductDetailPage({
  locale,
  productId,
  showroomSlug,
  branchSlug,
  shopDomain,
}: ShowroomProductDetailPageProps) {
  const model = useShowroomProductDetailPage(
    locale,
    productId,
    showroomSlug,
    branchSlug,
    shopDomain
  );
  const themeVariant = resolveShowroomThemeVariant(model.viewConfig.templateCode);
  const themeSurface = SHOWROOM_THEME_SURFACE_CLASSES[themeVariant];
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const isInitialLoading = model.detailQuery.isFetching && !model.detail;
  const hasInitialError = model.detailQuery.isError && !model.detail;
  const errorMessage =
    model.detailQuery.error instanceof Error
      ? model.detailQuery.error.message
      : model.copy.notFound;

  useEffect(() => {
    setActiveMediaIndex(0);
  }, [productId]);

  const detail = model.detail;
  const mediaItems = useMemo<ShowroomDetailMediaItem[]>(() => {
    if (!detail) return [];

    const output: ShowroomDetailMediaItem[] = [];
    const seenImageUrls = new Set<string>();

    const appendImage = (url: string | null, alt: string) => {
      if (!url) return;
      const normalizedUrl = url.trim();
      if (!normalizedUrl || seenImageUrls.has(normalizedUrl)) return;
      seenImageUrls.add(normalizedUrl);
      output.push({
        type: "image",
        id: `img:${normalizedUrl}`,
        src: normalizedUrl,
        alt,
      });
    };

    appendImage(model.coverImageUrl, `${detail.title} cover`);
    model.galleryImageUrls.forEach((url, index) => {
      appendImage(url, `${detail.title} ${index + 1}`);
    });

    model.youtubeVideoEmbedUrls.forEach((embedUrl, index) => {
      const normalizedEmbedUrl = embedUrl.trim();
      if (!normalizedEmbedUrl) return;
      output.push({
        type: "video",
        id: `video:${normalizedEmbedUrl}:${index}`,
        embedUrl: normalizedEmbedUrl,
        title: `${detail.title} video ${index + 1}`,
        thumbnailUrl: resolveYouTubeThumbnailUrl(normalizedEmbedUrl),
      });
    });

    return output;
  }, [detail, model.coverImageUrl, model.galleryImageUrls, model.youtubeVideoEmbedUrls]);

  const activeMedia = useMemo(() => {
    if (mediaItems.length === 0) return null;
    const safeIndex = Math.min(activeMediaIndex, mediaItems.length - 1);
    return mediaItems[safeIndex] ?? null;
  }, [activeMediaIndex, mediaItems]);

  if (isInitialLoading) {
    return (
      <section className={cn("min-h-screen px-4 py-6 md:py-10", themeSurface.pageClass)}>
        <div className={cn("mx-auto max-w-6xl rounded-3xl p-6 text-sm text-muted-foreground", themeSurface.panelClass)}>
          {model.copy.loading}
        </div>
      </section>
    );
  }

  if (hasInitialError) {
    return (
      <section className={cn("min-h-screen px-4 py-6 md:py-10", themeSurface.pageClass)}>
        <div className="mx-auto max-w-6xl rounded-3xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive shadow-md">
          <p>{errorMessage}</p>
          <button
            type="button"
            onClick={() => model.detailQuery.refetch()}
            className="mt-3 rounded-lg border border-destructive/40 bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
          >
            {model.copy.retry}
          </button>
        </div>
      </section>
    );
  }

  if (!detail) {
    return (
      <section className={cn("min-h-screen px-4 py-6 md:py-10", themeSurface.pageClass)}>
        <div className={cn("mx-auto max-w-6xl rounded-3xl p-6 text-sm text-muted-foreground", themeSurface.panelClass)}>
          {model.copy.notFound}
        </div>
      </section>
    );
  }

  const rentPriceReference =
    detail.rentPricePerDay ??
    detail.pricePlan.pricePerDay ??
    detail.pricePlan.price1d;

  const genderLabel = detail.gender
    ? model.genderOptions.find((entry) => entry.value === detail.gender)?.label ?? "-"
    : "-";

  const rawDescription = detail.description?.trim() ?? "";
  const richDescriptionHtml = hasHtmlMarkup(rawDescription)
    ? sanitizeRichTextHtml(rawDescription).trim() || null
    : null;

  return (
    <section className={cn("min-h-screen px-4 py-6 md:py-10", themeSurface.pageClass)}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <header className={cn("space-y-4 rounded-3xl p-5 md:p-6", themeSurface.panelClass)}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link
              href={model.showroomPath}
              className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{model.copy.backToShowroom}</span>
            </Link>

            {model.viewConfig.display.showShortlist ? (
              <Link
                href={model.shortlistPath}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
              >
                {model.copy.viewShortlist}
              </Link>
            ) : null}
          </div>

          <div>
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">{detail.title}</h1>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>
                {model.copy.categoryLabel}: {detail.categoryName ?? "-"}
              </span>
              <span>
                {model.copy.materialLabel}: {detail.material ?? "-"}
              </span>
              <span>
                {model.copy.genderLabel}: {genderLabel}
              </span>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.05fr,1fr]">
          <article className={cn("space-y-3 rounded-3xl p-4 md:p-5", themeSurface.panelClass)}>
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-border bg-muted">
              {activeMedia?.type === "image" ? (
                <img
                  src={activeMedia.src}
                  alt={activeMedia.alt}
                  className="h-full w-full object-cover"
                />
              ) : activeMedia?.type === "video" ? (
                <iframe
                  src={withYouTubeAutoplay(activeMedia.embedUrl)}
                  title={activeMedia.title}
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full border-0"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                  {model.copy.noImage}
                </div>
              )}
            </div>

            {mediaItems.length > 0 ? (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {mediaItems.map((mediaItem, index) => (
                  <button
                    key={mediaItem.id}
                    type="button"
                    onClick={() => setActiveMediaIndex(index)}
                    className={`relative aspect-square overflow-hidden rounded-xl border ${
                      index === activeMediaIndex ? "border-primary" : "border-border"
                    }`}
                    aria-label={mediaItem.type === "video" ? mediaItem.title : mediaItem.alt}
                  >
                    {mediaItem.type === "image" ? (
                      <img
                        src={mediaItem.src}
                        alt={mediaItem.alt}
                        className="h-full w-full object-cover"
                      />
                    ) : mediaItem.thumbnailUrl ? (
                      <>
                        <img
                          src={mediaItem.thumbnailUrl}
                          alt={mediaItem.title}
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white">
                          <PlayCircle className="h-5 w-5" />
                        </span>
                      </>
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/65 text-white">
                        <PlayCircle className="h-5 w-5" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : null}
          </article>

          <article className={cn("space-y-4 rounded-3xl p-4 md:p-5", themeSurface.panelClass)}>
            {model.viewConfig.display.showPriceReference && detail.isRentable ? (
              <p className="text-2xl font-bold text-primary md:text-3xl">
                {formatMoney(rentPriceReference, {
                  locale,
                  currency: "VND",
                  maximumFractionDigits: 0,
                }) || "-"}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  {model.copy.perDayLabel}
                </span>
              </p>
            ) : null}

            {model.viewConfig.display.showSalePriceReference && detail.isSaleable ? (
              <p className="text-sm text-muted-foreground">
                {model.copy.salePriceLabel}: {" "}
                <span className="font-semibold text-foreground">
                  {formatMoney(detail.salePrice, {
                    locale,
                    currency: "VND",
                    maximumFractionDigits: 0,
                  }) || "-"}
                </span>
              </p>
            ) : null}

            {model.viewConfig.display.showDepositReference ? (
              <p className="text-sm text-muted-foreground">
                {model.copy.depositLabel}: {" "}
                <span className="font-semibold text-foreground">
                  {formatMoney(detail.pricePlan.defaultDepositAmount, {
                    locale,
                    currency: "VND",
                    maximumFractionDigits: 0,
                  }) || "-"}
                </span>
              </p>
            ) : null}

            {model.viewConfig.display.showSuccessfulRentCount ? (
              <p className="text-sm text-muted-foreground">
                {model.copy.remainingItemsLabel}: {" "}
                <span className="font-semibold text-foreground">
                  {detail.remainingItems}
                </span>
              </p>
            ) : null}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {model.copy.descriptionTitle}
              </p>
              {richDescriptionHtml ? (
                <div
                  className="mt-2 text-sm text-foreground/85 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-6"
                  dangerouslySetInnerHTML={{ __html: richDescriptionHtml }}
                />
              ) : (
                <p className="mt-2 whitespace-pre-line text-sm text-foreground/85">
                  {detail.description?.trim() ? detail.description : model.copy.noDescription}
                </p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {model.copy.sizeLabel}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {detail.readyItemSizeBreakdown.length > 0 ? (
                  detail.readyItemSizeBreakdown.map((entry) => (
                    <span
                      key={`${entry.size ?? "__unset__"}:${entry.count}`}
                      className="rounded-xl border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground"
                    >
                      {(entry.size ?? model.copy.unassignedSizeLabel) + ` (${entry.count})`}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {model.copy.colorLabel}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {detail.colors.length > 0 ? (
                  detail.colors.map((color) => (
                    <span
                      key={color}
                      className="rounded-xl border border-border bg-muted/20 px-3 py-1 text-xs text-foreground"
                    >
                      {color}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </div>
            </div>

            {detail.tags.length > 0 ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {model.copy.tagsTitle}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {detail.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {model.viewConfig.display.showShortlist ? (
              <button
                type="button"
                onClick={model.toggleShortlist}
                className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold ${
                  model.isShortlisted
                    ? "border border-border bg-muted text-foreground"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                <Heart className={`h-4 w-4 ${model.isShortlisted ? "fill-current" : ""}`} />
                {model.isShortlisted ? model.copy.shortlistRemove : model.copy.shortlistAdd}
              </button>
            ) : null}
          </article>
        </section>

      </div>
    </section>
  );
});
