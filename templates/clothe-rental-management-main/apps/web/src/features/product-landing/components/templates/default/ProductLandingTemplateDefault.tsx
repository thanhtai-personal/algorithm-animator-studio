"use client";

import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import type { AppLocale } from "@/constants/locale";
import { PublicContactInfo } from "@/components/layout/PublicContactInfo";
import { PublicSocialLinks } from "@/components/layout/PublicSocialLinks";
import { buildShowroomDetailPath } from "@/features/showroom/utils/paths";
import { formatMoney } from "@/utils/format/money";
import type { ProductLandingTemplateModel } from "../shared/productLandingTemplateModel";
import { resolveBrandDisplayName } from "../shared/resolveBrandDisplayName";

interface ProductLandingTemplateDefaultProps {
  locale: AppLocale;
  model: ProductLandingTemplateModel;
  bookingPath: string;
  bookingActionLabel: string;
}

export function ProductLandingTemplateDefault({
  locale,
  model,
  bookingPath,
  bookingActionLabel,
}: ProductLandingTemplateDefaultProps) {
  const brandName = resolveBrandDisplayName({
    branchName: model.branchName,
    pageName: model.pageName,
    fallback: "KATA",
  });

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-accent/20" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 text-center md:py-24">
          {model.isFallback ? (
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {model.copy.fallbackNotice}
            </p>
          ) : null}
          {model.pageLogoUrl ? (
            <div className="mx-auto mb-4 flex min-h-[92px] items-center justify-center rounded-2xl border border-border/60 bg-card/70 px-5 py-3 shadow-sm">
              <img
                src={model.pageLogoUrl}
                alt={model.pageName}
                width={340}
                height={96}
                data-edit-slot="default.meta.pageLogo"
                className="h-20 w-auto max-w-[340px] object-contain md:h-24"
              />
            </div>
          ) : (
            <span
              data-edit-slot="default.meta.pageLogo"
              aria-hidden
              className="pointer-events-none absolute left-8 top-8 h-1 w-1 opacity-0"
            />
          )}
          <p
            data-edit-slot="default.meta.pageName"
            className="break-words text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
          >
            {model.pageName}
          </p>
          <div
            data-edit-slot="default.hero.badge"
            className="mx-auto inline-flex rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary"
          >
            {model.heroBadge}
          </div>
          <h1
            data-edit-slot="default.hero.heading"
            className="mx-auto mt-5 max-w-4xl break-words text-3xl font-extrabold leading-[1.2] sm:text-4xl md:text-6xl md:leading-[1.15]"
          >
            {model.heroHeading}
          </h1>
          <p
            data-edit-slot="default.hero.subheading"
            className="mx-auto mt-4 max-w-2xl break-words text-base text-muted-foreground md:text-lg"
          >
            {model.heroSubheading}
          </p>

          <button
            type="button"
            onClick={model.openShowroom}
            className="mx-auto mt-8 flex w-full max-w-2xl items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Search className="h-4 w-4" />
            </span>
            <span data-edit-slot="default.hero.searchPlaceholder" className="line-clamp-2 text-sm text-muted-foreground">
              {model.searchPlaceholder}
            </span>
            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </button>

          <Link
            href={bookingPath}
            className="mx-auto mt-3 inline-flex items-center gap-2 rounded-xl border border-primary/35 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary"
          >
            {bookingActionLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-4 px-4 py-10 md:grid-cols-4">
        {model.stats.map((entry) => (
          <article
            key={entry.label}
            className="rounded-xl border border-border bg-card p-4 text-center"
          >
            <p className="text-2xl font-bold text-primary md:text-3xl">{entry.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{entry.label}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-6 md:py-10">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 data-edit-slot="default.featured.title" className="text-2xl font-bold">
            {model.featuredTitle}
          </h2>
          <button
            type="button"
            onClick={model.openShowroom}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
          >
            <span data-edit-slot="default.featured.showMoreLabel">{model.featuredShowMoreLabel}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {model.isFeaturedLoading ? (
          <p className="text-sm text-muted-foreground">{model.copy.loading}</p>
        ) : model.featuredProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground">{model.copy.emptyFeatured}</p>
        ) : (
          <div
            data-edit-slot="default.featured.products"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {model.featuredProducts.map((product) => {
              const detailHref = buildShowroomDetailPath(
                locale,
                product.id,
                model.showroomSlug,
                model.branchSlug,
                model.shopDomain
              );

              return (
                <Link
                  key={product.id}
                  href={detailHref}
                  className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative aspect-[3/4] bg-muted">
                    {product.coverImageUrl ? (
                      <img
                        src={product.coverImageUrl}
                        alt={product.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="line-clamp-2 text-sm font-semibold text-foreground">
                      {product.title}
                    </p>
                    {product.categoryName ? (
                      <p className="text-xs text-muted-foreground">
                        {product.categoryName}
                      </p>
                    ) : null}
                    {typeof product.rentPricePerDay === "number" ? (
                      <p className="text-sm font-semibold text-primary">
                        {formatMoney(product.rentPricePerDay, {
                          locale,
                          currency: "VND",
                        })}
                      </p>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="border-y border-border bg-muted/20 py-10">
        <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 md:grid-cols-3">
          {model.perks.map((entry) => (
            <article key={entry.title} className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-semibold text-foreground">{entry.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{entry.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-10">
        <h2 className="mb-4 text-2xl font-bold">{model.copy.testimonialsTitle}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {model.testimonials.map((entry, index) => (
            <article key={entry.name} className="rounded-xl border border-border bg-card p-4">
              <p data-edit-slot={`default.testimonials.${index}.text`} className="text-sm text-muted-foreground">
                &ldquo;{entry.text}&rdquo;
              </p>
              <p data-edit-slot={`default.testimonials.${index}.name`} className="mt-3 text-sm font-semibold">
                {entry.name}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-primary/5 py-14 text-center">
        <button
          type="button"
          onClick={model.openShowroom}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          {model.copy.openShowroomAction}
          <ArrowRight className="h-4 w-4" />
        </button>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-3 px-4 text-center">
          <p className="text-sm text-muted-foreground">© 2026 {brandName}</p>
          <PublicContactInfo
            info={model.contactInfo}
            hotlineSlotId="default.contact.hotline"
            storeAddressSlotId="default.contact.address"
          />
          <div data-edit-slot="default.social.links" className="inline-flex">
            <PublicSocialLinks links={model.socialLinks} />
          </div>
        </div>
      </footer>
    </>
  );
}
