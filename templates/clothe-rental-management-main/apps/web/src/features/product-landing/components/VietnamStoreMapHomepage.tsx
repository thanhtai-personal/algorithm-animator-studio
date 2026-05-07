import Link from "next/link";
import type { CSSProperties } from "react";
import type { AppLocale } from "@/constants/locale";
import type { GlobalHomepageMapMarkerCollection } from "@/features/product-landing/utils/globalHomepageMapConfig";
import { buildVietnamStoreMapMarkers } from "@/features/product-landing/utils/vietnamStoreMapMarkers";
import type { PublicBranchMapItemDto } from "@/types/settingsModule";
import { localizePathname } from "@/utils/locale";
import styles from "./VietnamStoreMapHomepage.module.css";

interface VietnamStoreMapHomepageProps {
  locale: AppLocale;
  branches: PublicBranchMapItemDto[];
  currentUserDisplayName?: string | null;
  currentUserRole?: string | null;
  content?: VietnamStoreMapHomepageContent | null;
  previewMode?: boolean;
  editableSlots?: boolean;
  selectedMarkerId?: string | null;
}

export interface VietnamStoreMapHomepageContent {
  brandName?: string | null;
  badge?: string | null;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  markers?: GlobalHomepageMapMarkerCollection | null;
}

export function VietnamStoreMapHomepage({
  locale,
  branches,
  currentUserDisplayName = null,
  currentUserRole = null,
  content = null,
  previewMode = false,
  editableSlots = false,
  selectedMarkerId = null,
}: VietnamStoreMapHomepageProps) {
  const normalizedRole =
    typeof currentUserRole === "string" ? currentUserRole.trim().toLowerCase() : "";
  const isAdminRole =
    normalizedRole === "owner_admin" ||
    normalizedRole === "admin" ||
    normalizedRole === "manager" ||
    normalizedRole === "accountant";

  const copy =
    locale === "vi"
      ? {
          badge: "Hệ thống cửa hàng",
          title: "KATA Shopping",
          subtitle: "trên khắp Việt Nam",
          description:
            "Khám phá bản đồ cửa hàng và chọn chi nhánh phù hợp để xem bộ sưu tập đang cho thuê.",
          login: "Đăng nhập",
          goToAdmin: "Vào trang quản trị",
          accountFallback: "Tài khoản",
          noBranch: "Hiện chưa có chi nhánh đang hoạt động.",
        }
      : {
          badge: "Store network",
          title: "KATA Shopping",
          subtitle: "across Vietnam",
          description:
            "Explore our branch map and choose a store to browse products available for rent.",
          login: "Login",
          goToAdmin: "Go to admin page",
          accountFallback: "Account",
          noBranch: "No active branch is available yet.",
        };

  const markers = buildVietnamStoreMapMarkers({
    locale,
    branches,
    customMarkers: content?.markers ?? null,
  });
  const previewItems = Array.from(
    markers.reduce((acc, marker) => {
      if (!acc.has(marker.branchId)) {
        acc.set(marker.branchId, marker);
      }
      return acc;
    }, new Map<string, (typeof markers)[number]>()).values()
  ).slice(0, 2);
  const authPath = localizePathname("/auth", locale);
  const adminPath = localizePathname("/dashboard", locale);
  const accountLabel = currentUserDisplayName?.trim() || copy.accountFallback;
  const brandName = content?.brandName?.trim() || copy.title;
  const badgeText = content?.badge?.trim() || copy.badge;
  const titleText = content?.title?.trim() || copy.title;
  const subtitleText = content?.subtitle?.trim() || copy.subtitle;
  const descriptionText = content?.description?.trim() || copy.description;
  const pageClassName = previewMode ? `${styles.page} ${styles.previewPage}` : styles.page;
  const headerClassName = previewMode ? `${styles.header} ${styles.headerPreview}` : styles.header;

  return (
    <main className={pageClassName}>
      <div className={styles.gridBackground} />
      <div className={styles.glowLeft} />
      <div className={styles.glowRight} />

      <header className={headerClassName}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>{brandName}</div>
          {isAdminRole ? (
            previewMode ? (
              <span className={styles.loginButton}>{copy.goToAdmin}</span>
            ) : (
              <Link href={adminPath} className={styles.loginButton}>
                {copy.goToAdmin}
              </Link>
            )
          ) : currentUserDisplayName ? (
            <span className={styles.userBadge} title={accountLabel}>
              {accountLabel}
            </span>
          ) : (
            previewMode ? (
              <span className={styles.loginButton}>{copy.login}</span>
            ) : (
              <Link href={authPath} className={styles.loginButton}>
                {copy.login}
              </Link>
            )
          )}
        </div>
      </header>

      <div className={styles.content}>
        <section className={styles.heroSection}>
          <div
            className={styles.badge}
            data-edit-slot={editableSlots ? "global.hero.badge" : undefined}
          >
            <span className={styles.badgeDot} />
            {badgeText}
          </div>

          <h1
            className={styles.title}
            data-edit-slot={editableSlots ? "global.hero.heading" : undefined}
          >
            <span className={styles.titleGradient}>{titleText}</span>
            <span
              className={styles.subtitle}
              data-edit-slot={editableSlots ? "global.hero.subheading" : undefined}
            >
              {subtitleText}
            </span>
          </h1>

          <p
            className={styles.description}
            data-edit-slot={editableSlots ? "global.hero.description" : undefined}
          >
            {descriptionText}
          </p>

          <div className={styles.previewList}>
            {previewItems.map((branch) => (
              previewMode ? (
                <div
                  key={`preview-${branch.markerId}`}
                  className={styles.previewCard}
                  style={
                    {
                      "--branch-ring": branch.ring,
                      "--branch-color": branch.color,
                    } as CSSProperties
                  }
                >
                  <span className={styles.previewDot} />
                  <div className={styles.previewText}>
                    <strong>{branch.markerLabel ?? branch.mapLabel ?? branch.branchName}</strong>
                    <span>{branch.branchDomain}</span>
                  </div>
                </div>
              ) : (
                <Link
                  key={`preview-${branch.markerId}`}
                  href={branch.href}
                  className={styles.previewCard}
                  style={
                    {
                      "--branch-ring": branch.ring,
                      "--branch-color": branch.color,
                    } as CSSProperties
                  }
                >
                  <span className={styles.previewDot} />
                  <div className={styles.previewText}>
                    <strong>{branch.markerLabel ?? branch.mapLabel ?? branch.branchName}</strong>
                    <span>{branch.branchDomain}</span>
                  </div>
                </Link>
              )
            ))}
          </div>
        </section>

        <section
          className={styles.mapSection}
          data-edit-slot={editableSlots ? "global.map.markers" : undefined}
        >
          <div className={styles.mapShell}>
            <div className={styles.mapGlow} />
            <img
              src="/template-assets/homepage-3d/vietnam-map-3d.png"
              alt={locale === "vi" ? "Bản đồ Việt Nam" : "Vietnam map"}
              className={styles.mapImage}
              draggable={false}
            />

            <div className={styles.markerLayer}>
              {markers.map((branch) => {
                const markerClassName =
                  branch.markerId === selectedMarkerId
                    ? `${styles.markerAnchor} ${styles.markerAnchorSelected}`
                    : styles.markerAnchor;

                return previewMode ? (
                  <div
                    key={branch.markerId}
                    className={`${markerClassName} ${styles.markerAnchorStatic}`}
                    style={
                      {
                        left: `${branch.leftPct}%`,
                        top: `${branch.topPct}%`,
                        "--branch-color": branch.color,
                        "--branch-ring": branch.ring,
                      } as CSSProperties
                    }
                    aria-label={`${branch.branchName} - ${branch.branchDomain}`}
                  >
                    <span className={styles.markerLabel}>
                      {branch.markerLabel ?? branch.mapLabel ?? branch.branchName}
                    </span>
                  </div>
                ) : (
                  <Link
                    key={branch.markerId}
                    href={branch.href}
                    className={markerClassName}
                    style={
                      {
                        left: `${branch.leftPct}%`,
                        top: `${branch.topPct}%`,
                        "--branch-color": branch.color,
                        "--branch-ring": branch.ring,
                      } as CSSProperties
                    }
                    aria-label={`${branch.branchName} - ${branch.branchDomain}`}
                  >
                    <span className={styles.markerLabel}>
                      {branch.markerLabel ?? branch.mapLabel ?? branch.branchName}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {markers.length === 0 ? <p className={styles.emptyState}>{copy.noBranch}</p> : null}
    </main>
  );
}
