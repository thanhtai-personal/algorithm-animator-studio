"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { AppLocale } from "@/constants/locale";
import {
  buildShowroomBasePath,
  normalizeShopDomain,
} from "@/features/showroom/utils/paths";
import type { ProductLandingTemplateModel } from "../shared/productLandingTemplateModel";

interface ProductLandingTemplate3DMapHomepageProps {
  locale: AppLocale;
  model: ProductLandingTemplateModel;
  brandName: string;
  bookingPath: string;
  bookingActionLabel: string;
  hideTemplateHeader: boolean;
}

interface MapStoreSeed {
  id: string;
  name: string;
  province: string;
  shopDomain: string;
  leftPct: number;
  topPct: number;
  color: string;
  ring: string;
}

interface MapStore extends MapStoreSeed {
  href: string;
}

const FALLBACK_STORES: MapStoreSeed[] = [
  {
    id: "july",
    name: "July",
    province: "Phú Thọ",
    shopDomain: "thoi-trang-july",
    leftPct: 40,
    topPct: 22,
    color: "oklch(0.72 0.18 10)",
    ring: "oklch(0.85 0.12 10)",
  },
  {
    id: "kata",
    name: "KATA",
    province: "Đắk Nông",
    shopDomain: "kata",
    leftPct: 55,
    topPct: 65,
    color: "oklch(0.6 0.22 290)",
    ring: "oklch(0.8 0.15 290)",
  },
];

function buildDefaultStoreHref(locale: AppLocale, shopDomain: string): string {
  return buildShowroomBasePath(locale, null, null, shopDomain);
}

export function ProductLandingTemplate3DMapHomepage({
  locale,
  model,
  brandName,
  bookingPath,
  bookingActionLabel,
  hideTemplateHeader,
}: ProductLandingTemplate3DMapHomepageProps) {
  const [hoveredStoreId, setHoveredStoreId] = useState<string | null>(null);
  const activeShopDomain = normalizeShopDomain(model.shopDomain);
  const normalizedBranchName = model.branchName?.trim() || brandName;
  const badgeLabel = locale === "vi" ? "Hệ thống cửa hàng" : "Store network";
  const titleSuffix = locale === "vi" ? "trên khắp Việt Nam" : "across Vietnam";
  const description =
    model.heroSubheading ||
    (locale === "vi"
      ? "Khám phá bản đồ 3D với các điểm cửa hàng của chúng tôi."
      : "Explore our 3D map to discover store locations.");
  const openShowroomLabel =
    locale === "vi" ? "Khám phá showroom" : "Explore showroom";

  const stores = useMemo<MapStore[]>(() => {
    const seeded = FALLBACK_STORES.map((entry) => ({
      ...entry,
      href: buildDefaultStoreHref(locale, entry.shopDomain),
    }));

    if (!activeShopDomain) return seeded;

    const matchIndex = seeded.findIndex(
      (entry) => entry.shopDomain === activeShopDomain,
    );

    if (matchIndex >= 0) {
      const existing = seeded[matchIndex];
      seeded[matchIndex] = {
        ...existing,
        name: normalizedBranchName || existing.name,
        href: model.showroomPath || existing.href,
      };
      return seeded;
    }

    return [
      {
        id: "active-branch",
        name: normalizedBranchName,
        province: locale === "vi" ? "Chi nhánh hiện tại" : "Current branch",
        shopDomain: activeShopDomain,
        leftPct: 48,
        topPct: 46,
        color: "oklch(0.65 0.2 160)",
        ring: "oklch(0.82 0.12 160)",
        href: model.showroomPath,
      },
      ...seeded,
    ];
  }, [activeShopDomain, locale, model.showroomPath, normalizedBranchName]);

  const storesPreview = stores.slice(0, 2);

  return (
    <main
      className={`relative min-h-screen overflow-hidden ${
        hideTemplateHeader ? "pt-4 md:pt-8" : "pt-28 md:pt-24"
      }`}
    >
      <div className="kata3d-map-grid absolute inset-0 opacity-40" />

      <div
        className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full blur-3xl"
        style={{ background: "oklch(0.72 0.18 35 / 0.25)" }}
      />
      <div
        className="pointer-events-none absolute -right-32 bottom-20 h-96 w-96 rounded-full blur-3xl"
        style={{ background: "oklch(0.78 0.15 200 / 0.25)" }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col items-center px-6 py-12 lg:flex-row lg:gap-16 lg:py-20">
        <div className="flex-1 text-center lg:text-left">
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-widest"
            style={{
              borderColor: "oklch(0.78 0.2 55 / 0.4)",
              background: "oklch(0.2 0.04 250 / 0.6)",
              color: "oklch(0.85 0.15 55)",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "oklch(0.78 0.2 55)" }}
            />
            {badgeLabel}
          </div>

          <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl">
            <span
              className="block bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, oklch(0.72 0.18 10), oklch(0.7 0.18 320))",
              }}
            >
              {normalizedBranchName}
            </span>
            <span className="mt-2 block text-3xl font-light text-foreground/80 md:text-4xl">
              {titleSuffix}
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-foreground/60 lg:mx-0 lg:text-lg">
            {description}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
            {storesPreview.map((store) => (
              <Link
                key={store.id}
                href={store.href}
                className="flex items-center gap-3 rounded-2xl border px-4 py-3 backdrop-blur-md transition-transform duration-300 hover:-translate-y-0.5"
                style={{
                  borderColor: store.ring.replace(")", " / 0.35)"),
                  background: "oklch(0.2 0.04 250 / 0.5)",
                }}
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{
                    background: store.color,
                    boxShadow: `0 0 12px ${store.color}`,
                  }}
                />
                <div className="text-left">
                  <div className="text-sm font-semibold">{store.province}</div>
                  <div className="text-xs text-foreground/50">{store.name}</div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <button
              type="button"
              onClick={model.openShowroom}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              {openShowroomLabel}
              <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              href={bookingPath}
              className="rounded-xl border border-border bg-card/70 px-4 py-2 text-sm font-semibold text-foreground"
            >
              {bookingActionLabel}
            </Link>
          </div>
        </div>

        <div className="mt-12 flex-1 lg:mt-0">
          <div className="relative mx-auto aspect-[704/1280] w-full max-w-[480px]">
            <div
              className="pointer-events-none absolute inset-0 blur-3xl"
              style={{
                background:
                  "radial-gradient(ellipse at center, oklch(0.85 0.1 280 / 0.35), transparent 65%)",
              }}
            />

            <img
              src="/template-assets/homepage-3d/vietnam-map-3d.png"
              alt={locale === "vi" ? "Bản đồ Việt Nam" : "Vietnam map"}
              width={768}
              height={1376}
              className="relative h-full w-full select-none object-contain"
              style={{
                filter: "drop-shadow(0 25px 35px oklch(0.4 0.1 260 / 0.35))",
              }}
              draggable={false}
            />

            <div className="absolute inset-0">
              {stores.map((store) => {
                const isHover = hoveredStoreId === store.id;

                return (
                  <Link
                    key={store.id}
                    href={store.href}
                    className="group absolute z-10"
                    style={{
                      left: `${store.leftPct}%`,
                      top: `${store.topPct}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                    onMouseEnter={() => setHoveredStoreId(store.id)}
                    onMouseLeave={() => setHoveredStoreId(null)}
                    aria-label={`${store.name} - ${store.province}`}
                  >
                    <span
                      className="kata3d-map-pulse-ring absolute left-1/2 top-1/2 h-12 w-12 rounded-full"
                      style={{ border: `2px solid ${store.ring}` }}
                    />
                    <span
                      className="kata3d-map-pulse-ring absolute left-1/2 top-1/2 h-12 w-12 rounded-full"
                      style={{
                        border: `2px solid ${store.ring}`,
                        animationDelay: "1s",
                      }}
                    />

                    <div
                      className="kata3d-map-marker relative flex flex-col items-center"
                      style={{
                        transform: "translate(-50%, -100%)",
                        filter: isHover
                          ? `drop-shadow(0 14px 20px ${store.color.replace(")", " / 0.5)")})`
                          : `drop-shadow(0 8px 14px ${store.color.replace(")", " / 0.4)")})`,
                        transition: "filter 0.3s",
                      }}
                    >
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-full"
                        style={{
                          background: `radial-gradient(circle at 30% 25%, oklch(1 0 0 / 0.9), ${store.color} 60%, ${store.color.replace(")", " / 0.85)")} 100%)`,
                          border: "3px solid white",
                        }}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden
                        >
                          <path
                            d="M12 2 L14.5 9 L22 9.5 L16 14 L18 21.5 L12 17 L6 21.5 L8 14 L2 9.5 L9.5 9 Z"
                            fill="white"
                          />
                        </svg>
                      </div>
                      <div
                        className="h-3 w-1.5 rounded-b-full"
                        style={{ background: store.color, marginTop: "-2px" }}
                      />
                    </div>

                    <div
                      className="absolute left-1/2 whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold tracking-wide transition-all duration-300"
                      style={{
                        top: "calc(100% + 6px)",
                        background: "white",
                        color: store.color,
                        border: `2px solid ${store.color}`,
                        boxShadow: isHover
                          ? `0 8px 20px ${store.color.replace(")", " / 0.45)")}`
                          : "0 4px 10px oklch(0.3 0.05 260 / 0.2)",
                        transform: `translateX(-50%) translateY(${isHover ? "2px" : "0"}) scale(${isHover ? 1.08 : 1})`,
                      }}
                    >
                      {store.name}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
