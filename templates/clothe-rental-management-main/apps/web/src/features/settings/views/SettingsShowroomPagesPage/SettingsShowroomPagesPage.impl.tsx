"use client";

import { useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import type { AppLocale } from "@/constants/locale";
import { VoiceDictationField } from "@/components/voice/VoiceDictationField";
import { SettingsAccessDenied } from "@/features/settings/components/SettingsAccessDenied";
import { SettingsShowroomThemeCharmFields } from "@/features/settings/components/SettingsShowroomThemeCharmFields";
import { SettingsShowroomTheme3DFields } from "@/features/settings/components/SettingsShowroomTheme3DFields";
import { SettingsShowroomThemeModernFields } from "@/features/settings/components/SettingsShowroomThemeModernFields";
import { SettingsTabs } from "@/features/settings/components/SettingsTabs";
import { useSettingsShowroomPagesPage } from "@/features/settings/hooks/useSettingsShowroomPagesPage";
import { useSettingsShowroomVisualEditor } from "@/features/settings/hooks/useSettingsShowroomVisualEditor";
import {
  SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_3D,
  SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_CHARM,
  SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_MODERN,
} from "@/features/showroom/constants";
import { normalizeShowroomTemplateCode } from "@/features/showroom/utils/showroomConfig";
import { MediaPickerModal } from "@/features/media/components/MediaPickerModal";
import { showroomClientService } from "@/features/showroom/services/showroomClientService";
import type { PublicBranchMapItemDto } from "@/types/settingsModule";
import { GlobalHomepageVisualEditor } from "./GlobalHomepageVisualEditor";
import { SettingsShowroomVisualEditor } from "./SettingsShowroomVisualEditor";

interface SettingsShowroomPagesPageProps {
  locale: AppLocale;
  embedded?: boolean;
  fixedBranchId?: string | null;
}

export const SettingsShowroomPagesPage = observer(function SettingsShowroomPagesPage({
  locale,
  embedded = false,
  fixedBranchId = null,
}: SettingsShowroomPagesPageProps) {
  const {
    copy,
    canManageSettings,
    query,
    updateMutation,
    showroomPages,
    actionError,
    actionSuccess,
    scope,
    setScope,
    canManageGlobalScope,
    scopeLockedToBranch,
    branchId,
    setBranchId,
    branchOptions,
    branchesForGlobalMapEditor,
    pageLocale,
    setPageLocale,
    templateId,
    setTemplateId,
    selectedTemplate,
    isThemeCharmSelected,
    isTheme3DSelected,
    isThemeModernSelected,
    title,
    setTitle,
    subtitle,
    setSubtitle,
    heroBadge,
    setHeroBadge,
    heroHeading,
    setHeroHeading,
    heroSubheading,
    setHeroSubheading,
    heroSearchPlaceholder,
    setHeroSearchPlaceholder,
    featuredTitle,
    setFeaturedTitle,
    featuredShowMoreLabel,
    setFeaturedShowMoreLabel,
    featuredProductIds,
    setFeaturedProductIds,
    toggleFeaturedProductId,
    pageNameVi,
    setPageNameVi,
    pageNameEn,
    setPageNameEn,
    pageLogoUrl,
    setPageLogoUrl,
    socialLinksDraft,
    updateSocialLink,
    contactInfoDraft,
    updateContactInfo,
    themeCharmDraft,
    setThemeCharmDraft,
    theme3dDraft,
    setTheme3dDraft,
    themeModernDraft,
    setThemeModernDraft,
    perkBundles,
    updatePerkBundle,
    testimonialBundles,
    updateTestimonialBundle,
    featuredProductOptions,
    seoDescription,
    setSeoDescription,
    showPriceReference,
    setShowPriceReference,
    showSalePriceReference,
    setShowSalePriceReference,
    showDepositReference,
    setShowDepositReference,
    showSuccessfulRentCount,
    setShowSuccessfulRentCount,
    showShortlist,
    setShowShortlist,
    publishNow,
    setPublishNow,
    globalMapMarkers,
    selectedMapMarkerId,
    setSelectedMapMarkerId,
    draggingMapMarkerId,
    setDraggingMapMarkerId,
    updateMapMarkerPosition,
    addMapMarker,
    removeMapMarker,
    moveMapMarker,
    updateMapMarkerBranch,
    updateMapMarkerLabel,
    isMapMarkerPositionDirty,
    voiceLanguage,
    onSave,
  } = useSettingsShowroomPagesPage(locale, {
    initialBranchId: fixedBranchId,
    lockBranchId: Boolean(embedded && fixedBranchId),
  });

  const [featuredSearch, setFeaturedSearch] = useState("");
  const [isLogoPickerOpen, setIsLogoPickerOpen] = useState(false);

  const logoPreview = useMemo(() => {
    const resolved = showroomClientService.resolveCoverImageUrl(pageLogoUrl);
    return resolved ?? (pageLogoUrl ? pageLogoUrl : null);
  }, [pageLogoUrl]);

  const filteredFeaturedProductOptions = useMemo(() => {
    const keyword = featuredSearch.trim().toLowerCase();
    if (!keyword) return featuredProductOptions;

    return featuredProductOptions.filter((entry) => {
      const haystack = `${entry.productCode} ${entry.name} ${entry.categoryName ?? ""}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [featuredProductOptions, featuredSearch]);
  const globalMapPreviewBranches = useMemo<PublicBranchMapItemDto[]>(
    () =>
      branchesForGlobalMapEditor
        .filter((entry) => entry.isActive)
        .map((entry, index) => ({
          branchId: entry.id,
          branchName: entry.name,
          branchDomain: entry.shopDomain,
          isActive: entry.isActive,
          mapLat: null,
          mapLng: null,
          mapLabel: entry.name,
          displayOrder: index + 1,
        })),
    [branchesForGlobalMapEditor]
  );
  const localizedPageName = (pageLocale === "vi" ? pageNameVi : pageNameEn).trim();
  const globalHomepagePreviewContent = useMemo(
    () => ({
      brandName: localizedPageName || heroHeading.trim() || title.trim() || null,
      badge: heroBadge.trim() || null,
      title: heroHeading.trim() || title.trim() || null,
      subtitle: heroSubheading.trim() || subtitle.trim() || null,
      description: seoDescription.trim() || null,
      markers: globalMapMarkers,
    }),
    [
      globalMapMarkers,
      heroBadge,
      heroHeading,
      heroSubheading,
      localizedPageName,
      seoDescription,
      subtitle,
      title,
    ]
  );

  const branchDisplayLabel = (() => {
    if (scope === "global") return copy.globalContextLabel;
    const selectedBranchLabel = branchOptions.find((entry) => entry.value === branchId)?.label;
    if (selectedBranchLabel) return selectedBranchLabel;

    const localizedPageName = (pageLocale === "vi" ? pageNameVi : pageNameEn).trim();
    if (localizedPageName) return localizedPageName;

    return "KATA";
  })();

  const visualEditor = useSettingsShowroomVisualEditor({
    locale,
    pageLocale,
    templateCode: selectedTemplate?.code ?? null,
    branchLabel: branchDisplayLabel,
    isThemeCharmSelected,
    isTheme3DSelected,
    isThemeModernSelected,
    themeCharmDraft,
    setThemeCharmDraft,
    theme3dDraft,
    setTheme3dDraft,
    themeModernDraft,
    setThemeModernDraft,
    heroBadge,
    setHeroBadge,
    heroHeading,
    setHeroHeading,
    heroSubheading,
    setHeroSubheading,
    heroSearchPlaceholder,
    setHeroSearchPlaceholder,
    featuredTitle,
    setFeaturedTitle,
    featuredShowMoreLabel,
    setFeaturedShowMoreLabel,
    featuredProductIds,
    setFeaturedProductIds,
    pageNameVi,
    setPageNameVi,
    pageNameEn,
    setPageNameEn,
    pageLogoUrl,
    setPageLogoUrl,
    perkBundles,
    testimonialBundles,
    updateTestimonialBundle,
    featuredProductOptions,
    socialLinksDraft,
    updateSocialLink,
    updateContactInfo,
    contactInfoDraft,
  });

  const editorModeCopy = locale === "vi"
    ? {
        title: "Chế độ chỉnh sửa",
        hint: "Visual editor hiển thị preview homepage theo theme, legacy form dùng để fallback.",
        visual: "Visual editor",
        legacy: "Legacy form",
      }
    : {
        title: "Editor mode",
        hint: "Visual editor renders in-place homepage preview; legacy form stays as rollout fallback.",
        visual: "Visual editor",
        legacy: "Legacy form",
      };

  const formatTemplateOptionLabel = (entry: {
    name: string;
    isDefault: boolean;
    isActive: boolean;
    code: string;
    templateVersion: number;
  }): string => {
    const normalizedCode = normalizeShowroomTemplateCode(entry.code);
    const defaultLabel = locale === "vi" ? "Mẫu mặc định" : "Default template";

    let baseLabel = defaultLabel;
    if (normalizedCode === SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_CHARM) {
      baseLabel = locale === "vi" ? "Mẫu giao diện dễ thương" : "Cute template";
    } else if (normalizedCode === SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_MODERN) {
      baseLabel = locale === "vi" ? "Mẫu giao diện hiện đại" : "Modern template";
    } else if (normalizedCode === SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_3D) {
      baseLabel = locale === "vi" ? "Mẫu giao diện 3D hiện đại" : "3D modern template";
    } else if (!entry.isDefault) {
      const normalizedName = entry.name.trim();
      baseLabel =
        normalizedName.length > 0 ? normalizedName : `${entry.code} v${entry.templateVersion}`;
    }

    return `${baseLabel}${entry.isActive ? "" : copy.inactiveTemplateSuffix}`;
  };

  if (!canManageSettings) {
    return <SettingsAccessDenied locale={locale} message={copy.noPermission} />;
  }

  if (!showroomPages && query.isLoading) {
    return (
      <section className="animate-fade-in rounded-3xl border border-border bg-card p-6 shadow-md">
        <p className="text-sm text-muted-foreground">{copy.loading}</p>
      </section>
    );
  }

  if (!showroomPages && query.isError) {
    return (
      <section className="animate-fade-in space-y-3 rounded-3xl border border-destructive/40 bg-destructive/5 p-6 shadow-md">
        <p className="text-sm text-destructive">{copy.loadError}</p>
        <button
          type="button"
          onClick={() => void query.refetch()}
          className="rounded-lg border border-destructive/30 bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
        >
          {copy.retryAction}
        </button>
      </section>
    );
  }

  if (!showroomPages) {
    return null;
  }

  const isSaving = updateMutation.isPending;
  const isGlobalScope = scope === "global";
  const submitFooterClassName = embedded
    ? "flex flex-wrap justify-end gap-2"
    : "sticky bottom-3 z-20 flex flex-wrap justify-end gap-2 rounded-2xl border border-border bg-card/95 px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-lg backdrop-blur";

  return (
    <section className={embedded ? "space-y-4" : "animate-fade-in space-y-5 pb-2"}>
      {embedded ? (
        <header className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground">{copy.title}</h2>
          <p className="text-xs text-muted-foreground">{copy.subtitle}</p>
        </header>
      ) : (
        <header className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-md md:p-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{copy.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{copy.subtitle}</p>
          </div>
          <SettingsTabs locale={locale} activeTab="showroomPages" />
        </header>
      )}

      {actionError ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {actionError}
        </p>
      ) : null}

      {actionSuccess ? (
        <p className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700">
          {actionSuccess}
        </p>
      ) : null}

      <fieldset
        disabled={isSaving}
        aria-busy={isSaving}
        className={isSaving ? "space-y-5 opacity-70" : "space-y-5"}
      >
        <section className="grid gap-4 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5 xl:grid-cols-3">
        {!embedded && canManageGlobalScope && !scopeLockedToBranch ? (
          <label className="space-y-1 text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wide">{copy.scopeLabel}</span>
            <select
              value={scope}
              onChange={(event) => setScope(event.target.value === "global" ? "global" : "branch")}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="global">{copy.globalScopeOption}</option>
              <option value="branch">{copy.branchScopeOption}</option>
            </select>
            <p className="text-[11px] text-muted-foreground">{copy.globalScopeHint}</p>
          </label>
        ) : null}
        {embedded ? (
          <div className="space-y-1 text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wide">{copy.branchLabel}</span>
            <div className="flex h-10 items-center rounded-xl border border-border bg-muted/20 px-3 text-sm text-foreground">
              {branchDisplayLabel}
            </div>
          </div>
        ) : scope === "global" ? (
          <div className="space-y-1 text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wide">{copy.branchLabel}</span>
            <div className="flex h-10 items-center rounded-xl border border-border bg-muted/20 px-3 text-sm text-foreground">
              {copy.globalContextLabel}
            </div>
          </div>
        ) : (
          <label className="space-y-1 text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wide">{copy.branchLabel}</span>
            <select
              value={branchId ?? ""}
              onChange={(event) => setBranchId(event.target.value || null)}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            >
              {branchOptions.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="space-y-1 text-xs text-muted-foreground">
          <span className="font-semibold uppercase tracking-wide">{copy.localeLabel}</span>
          <select
            value={pageLocale}
            onChange={(event) => setPageLocale(event.target.value as "vi" | "en")}
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
          >
            <option value="vi">vi</option>
            <option value="en">en</option>
          </select>
        </label>

        <label className="space-y-1 text-xs text-muted-foreground">
          <span className="font-semibold uppercase tracking-wide">{copy.templateLabel}</span>
          <select
            value={templateId}
            onChange={(event) => setTemplateId(event.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
          >
            {showroomPages.templates.map((entry) => (
              <option key={entry.id} value={entry.id} disabled={!entry.isActive}>
                {formatTemplateOptionLabel(entry)}
              </option>
            ))}
          </select>
        </label>
      </section>

      {isGlobalScope ? (
        <GlobalHomepageVisualEditor
          locale={locale}
          pageLocale={pageLocale}
          voiceLanguage={voiceLanguage}
          isSaving={isSaving}
          previewBranches={globalMapPreviewBranches}
          previewContent={globalHomepagePreviewContent}
          heroBadge={heroBadge}
          setHeroBadge={setHeroBadge}
          heroHeading={heroHeading}
          setHeroHeading={setHeroHeading}
          heroSubheading={heroSubheading}
          setHeroSubheading={setHeroSubheading}
          seoDescription={seoDescription}
          setSeoDescription={setSeoDescription}
          mapBranches={branchesForGlobalMapEditor}
          mapMarkers={globalMapMarkers}
          selectedMapMarkerId={selectedMapMarkerId}
          setSelectedMapMarkerId={setSelectedMapMarkerId}
          draggingMapMarkerId={draggingMapMarkerId}
          setDraggingMapMarkerId={setDraggingMapMarkerId}
          updateMapMarkerPosition={updateMapMarkerPosition}
          addMapMarker={addMapMarker}
          removeMapMarker={removeMapMarker}
          moveMapMarker={moveMapMarker}
          updateMapMarkerBranch={updateMapMarkerBranch}
          updateMapMarkerLabel={updateMapMarkerLabel}
          isMapMarkerPositionDirty={isMapMarkerPositionDirty}
        />
      ) : null}

      {!isGlobalScope && visualEditor.canUseVisualEditor ? (
        <section className="space-y-2 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {editorModeCopy.title}
          </p>
          <p className="text-xs text-muted-foreground">{editorModeCopy.hint}</p>
          <div className="inline-flex rounded-xl border border-border bg-muted/20 p-1">
            <button
              type="button"
              onClick={() => visualEditor.setEditorMode("visual")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                visualEditor.editorMode === "visual"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              {editorModeCopy.visual}
            </button>
            <button
              type="button"
              onClick={() => visualEditor.setEditorMode("legacy")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                visualEditor.editorMode === "legacy"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              {editorModeCopy.legacy}
            </button>
          </div>
        </section>
      ) : null}

      {!isGlobalScope && visualEditor.canUseVisualEditor && visualEditor.editorMode === "visual" ? (
        <SettingsShowroomVisualEditor
          locale={locale}
          pageLocale={pageLocale}
          branchId={branchId}
          isSaving={isSaving}
          model={visualEditor}
        />
      ) : !isGlobalScope && isThemeCharmSelected ? (
        <SettingsShowroomThemeCharmFields
          locale={locale}
          config={themeCharmDraft}
          onChange={setThemeCharmDraft}
          featuredSearch={featuredSearch}
          setFeaturedSearch={setFeaturedSearch}
          filteredFeaturedProductOptions={filteredFeaturedProductOptions}
          branchId={branchId}
        />
      ) : !isGlobalScope && isTheme3DSelected ? (
        <SettingsShowroomTheme3DFields
          locale={locale}
          config={theme3dDraft}
          onChange={setTheme3dDraft}
          featuredSearch={featuredSearch}
          setFeaturedSearch={setFeaturedSearch}
          filteredFeaturedProductOptions={filteredFeaturedProductOptions}
          branchId={branchId}
        />
      ) : !isGlobalScope && isThemeModernSelected ? (
        <SettingsShowroomThemeModernFields
          locale={locale}
          config={themeModernDraft}
          onChange={setThemeModernDraft}
          featuredSearch={featuredSearch}
          setFeaturedSearch={setFeaturedSearch}
          filteredFeaturedProductOptions={filteredFeaturedProductOptions}
          branchId={branchId}
        />
      ) : !isGlobalScope ? (
      <section className="space-y-4 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={showPriceReference}
              onChange={(event) => setShowPriceReference(event.target.checked)}
            />
            <span>{copy.showPriceLabel}</span>
          </label>

          <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={showSalePriceReference}
              onChange={(event) => setShowSalePriceReference(event.target.checked)}
            />
            <span>{copy.showSalePriceLabel}</span>
          </label>

          <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={showDepositReference}
              onChange={(event) => setShowDepositReference(event.target.checked)}
            />
            <span>{copy.showDepositLabel}</span>
          </label>

          <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={showSuccessfulRentCount}
              onChange={(event) => setShowSuccessfulRentCount(event.target.checked)}
            />
            <span>{copy.showSuccessfulRentCountLabel}</span>
          </label>

          <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={showShortlist}
              onChange={(event) => setShowShortlist(event.target.checked)}
            />
            <span>{copy.showShortlistLabel}</span>
          </label>

          <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={publishNow}
              onChange={(event) => setPublishNow(event.target.checked)}
            />
            <span>{copy.publishLabel}</span>
          </label>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-muted/10 p-3">
            <VoiceDictationField
              label={copy.titleLabel}
              value={title}
              onValueChange={setTitle}
              language={voiceLanguage}
              fieldType="input"
              locale={locale}
            />
          </div>

          <div className="rounded-2xl border border-border bg-muted/10 p-3">
            <VoiceDictationField
              label={copy.subtitleLabel}
              value={subtitle}
              onValueChange={setSubtitle}
              language={voiceLanguage}
              fieldType="input"
              locale={locale}
            />
          </div>

          <div className="rounded-2xl border border-border bg-muted/10 p-3">
            <VoiceDictationField
              label={copy.heroBadgeLabel}
              value={heroBadge}
              onValueChange={setHeroBadge}
              language={voiceLanguage}
              fieldType="input"
              locale={locale}
            />
          </div>

          <div className="rounded-2xl border border-border bg-muted/10 p-3">
            <VoiceDictationField
              label={copy.heroHeadingLabel}
              value={heroHeading}
              onValueChange={setHeroHeading}
              language={voiceLanguage}
              fieldType="textarea"
              rows={3}
              locale={locale}
            />
          </div>

          <div className="rounded-2xl border border-border bg-muted/10 p-3">
            <VoiceDictationField
              label={copy.heroSubheadingLabel}
              value={heroSubheading}
              onValueChange={setHeroSubheading}
              language={voiceLanguage}
              fieldType="textarea"
              rows={3}
              locale={locale}
            />
          </div>

          <div className="rounded-2xl border border-border bg-muted/10 p-3">
            <VoiceDictationField
              label={copy.heroSearchPlaceholderLabel}
              value={heroSearchPlaceholder}
              onValueChange={setHeroSearchPlaceholder}
              language={voiceLanguage}
              fieldType="input"
              locale={locale}
            />
          </div>

          <div className="rounded-2xl border border-border bg-muted/10 p-3">
            <VoiceDictationField
              label={copy.featuredTitleLabel}
              value={featuredTitle}
              onValueChange={setFeaturedTitle}
              language={voiceLanguage}
              fieldType="input"
              locale={locale}
            />
          </div>

          <div className="rounded-2xl border border-border bg-muted/10 p-3">
            <VoiceDictationField
              label={copy.featuredShowMoreLabel}
              value={featuredShowMoreLabel}
              onValueChange={setFeaturedShowMoreLabel}
              language={voiceLanguage}
              fieldType="input"
              locale={locale}
            />
          </div>

          <div className="space-y-3 rounded-2xl border border-border bg-muted/10 p-3 lg:col-span-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {copy.pageNameLabel}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{copy.bilingualRequiredHint}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-xs text-muted-foreground">
                <span>
                  {copy.viLabel} - {copy.pageNameLabel}
                </span>
                <input
                  type="text"
                  value={pageNameVi}
                  onChange={(event) => setPageNameVi(event.target.value)}
                  className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                />
              </label>

              <label className="space-y-1 text-xs text-muted-foreground">
                <span>
                  {copy.enLabel} - {copy.pageNameLabel}
                </span>
                <input
                  type="text"
                  value={pageNameEn}
                  onChange={(event) => setPageNameEn(event.target.value)}
                  className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                />
              </label>

              <label className="space-y-1 text-xs text-muted-foreground md:col-span-2">
                <span>{copy.pageLogoLabel}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="https://..."
                    value={pageLogoUrl}
                    onChange={(event) => setPageLogoUrl(event.target.value)}
                    className="h-9 flex-1 rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                  />
                  <button
                    type="button"
                    disabled={!branchId}
                    onClick={() => setIsLogoPickerOpen(true)}
                    title={!branchId ? (locale === "vi" ? "Cần chọn chi nhánh trước khi mở thư viện media." : "Select a branch before opening media library.") : undefined}
                    className="h-9 shrink-0 rounded-xl border border-border px-3 text-xs font-semibold text-muted-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {locale === "vi" ? "Chọn từ thư viện" : "Choose from library"}
                  </button>
                </div>

                {logoPreview ? (
                  <div className="mt-2">
                    <p className="text-[11px] font-medium text-muted-foreground">{locale === "vi" ? "Xem trước" : "Preview"}</p>
                    <div className="mt-1 w-32 overflow-hidden rounded-md border border-border/60 bg-muted/20 p-1">
                      <img src={logoPreview} alt={locale === "vi" ? "Logo xem trước" : "Logo preview"} className="h-16 w-full object-contain" />
                    </div>
                  </div>
                ) : null}
              </label>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-border bg-muted/10 p-3 lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {copy.infoPackagesTitle}
            </p>

            <div className="space-y-3">
              {perkBundles.map((entry, index) => (
                <div key={`perk-${index}`} className="space-y-2 rounded-xl border border-border bg-background p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {copy.packageLabel} {index + 1}
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">{copy.viLabel}</p>
                      <input
                        type="text"
                        value={entry.viTitle}
                        onChange={(event) =>
                          updatePerkBundle(index, {
                            viTitle: event.target.value,
                          })
                        }
                        placeholder="Tiêu đề"
                        className="h-9 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                      />
                      <textarea
                        rows={2}
                        value={entry.viDescription}
                        onChange={(event) =>
                          updatePerkBundle(index, {
                            viDescription: event.target.value,
                          })
                        }
                        placeholder="Mô tả"
                        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">{copy.enLabel}</p>
                      <input
                        type="text"
                        value={entry.enTitle}
                        onChange={(event) =>
                          updatePerkBundle(index, {
                            enTitle: event.target.value,
                          })
                        }
                        placeholder="Title"
                        className="h-9 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                      />
                      <textarea
                        rows={2}
                        value={entry.enDescription}
                        onChange={(event) =>
                          updatePerkBundle(index, {
                            enDescription: event.target.value,
                          })
                        }
                        placeholder="Description"
                        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-border bg-muted/10 p-3 lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {copy.testimonialsPackagesTitle}
            </p>

            <div className="space-y-3">
              {testimonialBundles.map((entry, index) => (
                <div
                  key={`testimonial-${index}`}
                  className="space-y-2 rounded-xl border border-border bg-background p-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {copy.testimonialLabel} {index + 1}
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">{copy.viLabel}</p>
                      <input
                        type="text"
                        value={entry.viName}
                        onChange={(event) =>
                          updateTestimonialBundle(index, {
                            viName: event.target.value,
                          })
                        }
                        placeholder="Tên khách hàng"
                        className="h-9 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                      />
                      <textarea
                        rows={2}
                        value={entry.viText}
                        onChange={(event) =>
                          updateTestimonialBundle(index, {
                            viText: event.target.value,
                          })
                        }
                        placeholder="Nội dung nhận xét"
                        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">{copy.enLabel}</p>
                      <input
                        type="text"
                        value={entry.enName}
                        onChange={(event) =>
                          updateTestimonialBundle(index, {
                            enName: event.target.value,
                          })
                        }
                        placeholder="Customer name"
                        className="h-9 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                      />
                      <textarea
                        rows={2}
                        value={entry.enText}
                        onChange={(event) =>
                          updateTestimonialBundle(index, {
                            enText: event.target.value,
                          })
                        }
                        placeholder="Quote"
                        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-muted/10 p-3 lg:col-span-2">
            <VoiceDictationField
              label={copy.seoDescriptionLabel}
              value={seoDescription}
              onValueChange={setSeoDescription}
              language={voiceLanguage}
              fieldType="textarea"
              rows={4}
              locale={locale}
            />
          </div>

          <div className="space-y-3 rounded-2xl border border-border bg-muted/10 p-3 lg:col-span-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {copy.featuredProductsLabel}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{copy.featuredProductsHint}</p>
            </div>

            <input
              type="search"
              value={featuredSearch}
              onChange={(event) => setFeaturedSearch(event.target.value)}
              placeholder={copy.featuredProductsSearchPlaceholder}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />

            <div className="max-h-56 space-y-2 overflow-auto rounded-xl border border-border bg-background p-2">
              {filteredFeaturedProductOptions.length === 0 ? (
                <p className="px-2 py-1 text-xs text-muted-foreground">{copy.noProductsLabel}</p>
              ) : (
                filteredFeaturedProductOptions.map((entry) => (
                  <label
                    key={entry.id}
                    className="flex items-start gap-2 rounded-lg border border-border bg-card px-2.5 py-2 text-xs text-foreground"
                  >
                    <input
                      type="checkbox"
                      checked={featuredProductIds.includes(entry.id)}
                      onChange={() => toggleFeaturedProductId(entry.id)}
                      className="mt-0.5"
                    />
                    <span className="leading-relaxed">
                      <span className="font-semibold">{entry.productCode}</span> - {entry.name}
                      {entry.categoryName ? (
                        <span className="text-muted-foreground"> ({entry.categoryName})</span>
                      ) : null}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
      ) : null}

      {!(visualEditor.canUseVisualEditor && visualEditor.editorMode === "visual") ? (
        <section className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {copy.socialLinksTitle}
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>{copy.facebookLinkLabel}</span>
              <input
                type="url"
                placeholder="https://facebook.com/..."
                value={socialLinksDraft.facebook}
                onChange={(event) => updateSocialLink("facebook", event.target.value)}
                onBlur={(event) => updateSocialLink("facebook", event.target.value.trim())}
                className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              />
            </label>

            <label className="space-y-1 text-xs text-muted-foreground">
              <span>{copy.tiktokLinkLabel}</span>
              <input
                type="url"
                placeholder="https://tiktok.com/@..."
                value={socialLinksDraft.tiktok}
                onChange={(event) => updateSocialLink("tiktok", event.target.value)}
                onBlur={(event) => updateSocialLink("tiktok", event.target.value.trim())}
                className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              />
            </label>

            <label className="space-y-1 text-xs text-muted-foreground">
              <span>{copy.zaloLinkLabel}</span>
              <input
                type="url"
                placeholder="https://zalo.me/..."
                value={socialLinksDraft.zalo}
                onChange={(event) => updateSocialLink("zalo", event.target.value)}
                onBlur={(event) => updateSocialLink("zalo", event.target.value.trim())}
                className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              />
            </label>

            <label className="space-y-1 text-xs text-muted-foreground">
              <span>{copy.telegramLinkLabel}</span>
              <input
                type="url"
                placeholder="https://t.me/..."
                value={socialLinksDraft.telegram}
                onChange={(event) => updateSocialLink("telegram", event.target.value)}
                onBlur={(event) => updateSocialLink("telegram", event.target.value.trim())}
                className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              />
            </label>
          </div>

          <div className="pt-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {copy.contactInfoTitle}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>{copy.hotlineLabel}</span>
              <input
                type="text"
                placeholder="0909 123 456"
                value={contactInfoDraft.hotline}
                onChange={(event) => updateContactInfo("hotline", event.target.value)}
                onBlur={(event) => updateContactInfo("hotline", event.target.value.trim())}
                className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              />
            </label>

            <label className="space-y-1 text-xs text-muted-foreground">
              <span>{copy.emailLabel}</span>
              <input
                type="email"
                placeholder="info@kata.vn"
                value={contactInfoDraft.email}
                onChange={(event) => updateContactInfo("email", event.target.value)}
                onBlur={(event) => updateContactInfo("email", event.target.value.trim())}
                className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              />
            </label>

            <label className="space-y-1 text-xs text-muted-foreground md:col-span-2">
              <span>{copy.storeAddressLabel}</span>
              <input
                type="text"
                placeholder="123 Nguyễn Huệ, Q.1, TP.HCM"
                value={contactInfoDraft.storeAddress}
                onChange={(event) => updateContactInfo("storeAddress", event.target.value)}
                onBlur={(event) => updateContactInfo("storeAddress", event.target.value.trim())}
                className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              />
            </label>
          </div>
        </section>
      ) : null}

      </fieldset>

      <MediaPickerModal
        locale={locale}
        open={isLogoPickerOpen}
        onOpenChange={(open) => setIsLogoPickerOpen(open)}
        branchId={branchId}
        defaultMediaType="image"
        onSelectAsset={(asset) => {
          const selectedUrl = asset.publicUrl;
          if (!selectedUrl) return;
          setPageLogoUrl(selectedUrl);
          setIsLogoPickerOpen(false);
        }}
      />

      <div className={submitFooterClassName}>
        <button
          type="button"
          onClick={() => void onSave(false)}
          disabled={isSaving}
          className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent disabled:opacity-60"
        >
          {copy.saveDraftAction}
        </button>

        <button
          type="button"
          onClick={() => void onSave(publishNow)}
          disabled={isSaving}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-60"
        >
          {copy.saveAction}
        </button>
      </div>
    </section>
  );
});
