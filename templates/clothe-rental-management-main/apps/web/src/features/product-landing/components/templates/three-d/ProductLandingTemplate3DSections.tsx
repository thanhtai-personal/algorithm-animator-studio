"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Heart, Mail, MapPin, Phone, Quote, Sparkles, Star } from "lucide-react";
import { PublicSocialLinks } from "@/components/layout/PublicSocialLinks";
import { parseFooterLinkEntry } from "@/lib/footerLinkEntries";
import type { ProductLandingTemplateModel } from "../shared/productLandingTemplateModel";
import { FEATURE_ICONS, type TemplateCopy } from "./productLandingTemplate3D.config";

interface ProductLandingTemplate3DSectionsProps {
  bookingActionLabel: string;
  bookingPath: string;
  brandName: string;
  copy: TemplateCopy;
  heroImage: string;
  hideTemplateHeader: boolean;
  model: ProductLandingTemplateModel;
  searchQuery: string;
}

function toTelHref(value: string): string | null {
  const compact = value.replace(/[^\d+]/g, "");
  return compact.length > 0 ? `tel:${compact}` : null;
}

function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;

        const durationMs = 2000;
        const startTime = performance.now();

        const animate = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / durationMs, 1);
          const eased = 1 - (1 - progress) ** 3;
          setCount(Math.floor(eased * target));
          if (progress < 1) requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
      },
      { threshold: 0.5 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref} className="kata3d-text-gradient text-3xl font-bold sm:text-4xl md:text-5xl">
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export function ProductLandingTemplate3DSections({
  bookingActionLabel,
  bookingPath,
  brandName,
  copy,
  heroImage,
  hideTemplateHeader,
  model,
  searchQuery,
}: ProductLandingTemplate3DSectionsProps) {
  const contactAddress = model.contactInfo.storeAddress;
  const contactHotline = model.contactInfo.hotline;
  const contactEmail = model.contactInfo.email;
  const contactHotlineHref = contactHotline ? toTelHref(contactHotline) : null;
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const visibleProducts = normalizedSearchQuery
    ? copy.products.filter((product) => {
        const haystack = `${product.name} ${product.tag} ${product.priceLabel}`.toLowerCase();
        return haystack.includes(normalizedSearchQuery);
      })
    : copy.products;
  const footerCategoryLinks = copy.categories
    .map(parseFooterLinkEntry)
    .filter((entry) => entry.label.length > 0);
  const footerSupportLinks = copy.supportItems
    .map(parseFooterLinkEntry)
    .filter((entry) => entry.label.length > 0);

  return (
    <>
      <section
        className={`kata3d-grain relative flex min-h-screen items-center overflow-hidden ${
          hideTemplateHeader ? "pt-0" : "pt-28 md:pt-24"
        }`}
      >
        <span
          data-edit-slot="3d.meta.pageLogo"
          aria-hidden
          className="pointer-events-none absolute left-5 top-5 h-1 w-1 opacity-0"
        />
        <div className="kata-float absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-[hsl(var(--kata-primary)/0.1)] blur-[120px]" />
        <div className="kata-float-delayed absolute -right-32 bottom-1/4 h-80 w-80 rounded-full bg-[hsl(var(--kata-primary)/0.05)] blur-[100px]" />

        <div className="container relative z-10 mx-auto px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="space-y-8">
              {model.isFallback ? (
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100/80">
                  {model.copy.fallbackNotice}
                </p>
              ) : null}

              <div className="kata3d-animate-fade-in inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs text-[hsl(var(--kata-primary))] kata3d-glass">
                <Sparkles size={14} />
                <span data-edit-slot="3d.hero.badge">{copy.heroBadge}</span>
              </div>

              <h1 className="kata3d-animate-fade-in text-4xl font-bold leading-[1.1] sm:text-5xl md:text-7xl" style={{ animationDelay: "0.1s" }}>
                <span data-edit-slot="3d.hero.line1">{copy.heroLine1}</span>
                <br />
                <span data-edit-slot="3d.hero.highlight" className="kata3d-text-gradient">
                  {copy.heroHighlight}
                </span>
                <br />
                <span data-edit-slot="3d.hero.line3">{copy.heroLine3}</span>
              </h1>

              <p
                data-edit-slot="3d.hero.subtitle"
                className="kata3d-animate-fade-in max-w-md text-base leading-relaxed text-[hsl(var(--kata-muted-foreground))] sm:text-lg"
                style={{ animationDelay: "0.2s" }}
              >
                {copy.heroSubtitle}
              </p>

              <div className="kata3d-animate-fade-in flex flex-col gap-4 sm:flex-row" style={{ animationDelay: "0.3s" }}>
                <button
                  type="button"
                  onClick={model.openShowroom}
                  className="group flex items-center justify-center gap-2 rounded-lg bg-[hsl(var(--kata-primary))] px-6 py-4 font-medium text-[hsl(var(--kata-primary-foreground))] transition-all duration-500 hover:scale-105 hover:shadow-[0_0_40px_-10px_hsl(var(--kata-primary)/0.6)] sm:px-8"
                >
                  {copy.heroPrimaryAction}
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </button>
                <Link href={bookingPath} className="kata3d-glass-hover rounded-lg px-6 py-4 text-center font-medium sm:px-8">
                  {bookingActionLabel || copy.heroSecondaryAction}
                </Link>
              </div>
            </div>

            <div className="kata3d-animate-fade-in-right kata3d-perspective-card relative hidden lg:block" style={{ animationDelay: "0.4s" }}>
              <div className="group relative">
                <div className="absolute inset-0 scale-105 rounded-2xl bg-gradient-to-br from-[hsl(var(--kata-primary)/0.2)] to-transparent blur-2xl transition-all duration-700 group-hover:blur-3xl" />
                <div className="kata3d-card-3d relative overflow-hidden rounded-2xl bg-[hsl(var(--kata-card)/0.35)]">
                  <img
                    src={heroImage}
                    alt={copy.heroFeaturedName}
                    width={720}
                    height={960}
                    data-edit-slot="3d.hero.image"
                    className="h-[600px] w-full object-contain"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--kata-background)/0.8)] via-transparent to-transparent" />
                  <div className="kata-float absolute bottom-6 left-6 right-6 rounded-xl p-4 kata3d-glass">
                    <p className="text-xs text-[hsl(var(--kata-muted-foreground))]">{copy.heroFeaturedLabel}</p>
                    <p className="font-semibold">{copy.heroFeaturedName}</p>
                    <p className="mt-1 font-bold text-[hsl(var(--kata-primary))]">{copy.heroFeaturedPrice}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--kata-background))] via-[hsl(var(--kata-secondary)/0.3)] to-[hsl(var(--kata-background))]" />
        <div className="container relative z-10 mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4 md:gap-8">
            {copy.stats.map((entry, index) => (
              <article
                key={entry.label}
                className="kata3d-animate-on-scroll kata3d-glass-hover rounded-2xl p-8 text-center"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div data-edit-slot={`3d.stats.${index}.value`}>
                  <AnimatedCounter target={entry.value} suffix={entry.suffix} />
                </div>
                <p
                  data-edit-slot={`3d.stats.${index}.label`}
                  className="mt-2 text-sm text-[hsl(var(--kata-muted-foreground))]"
                >
                  {entry.label}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="kata3d-animate-on-scroll mb-10 flex flex-col gap-3 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-sm font-medium text-[hsl(var(--kata-primary))]">{copy.collectionLabel}</p>
              <h2 className="text-3xl font-bold md:text-5xl">
                <span data-edit-slot="3d.collection.title">{copy.collectionTitle}</span>{" "}
                <span data-edit-slot="3d.collection.highlight" className="kata3d-text-gradient">
                  {copy.collectionHighlight}
                </span>
              </h2>
            </div>
            <button
              type="button"
              onClick={model.openShowroom}
              className="hidden items-center gap-2 text-sm text-[hsl(var(--kata-primary))] transition-all duration-300 hover:gap-3 md:flex"
            >
              {copy.featuredAction}
              <ArrowRight size={16} />
            </button>
          </div>

          <div data-edit-slot="3d.featured.products" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {visibleProducts.map((product, index) => (
              <article
                key={product.id}
                className="kata3d-animate-on-scroll group"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="kata3d-glass-hover kata3d-card-3d overflow-hidden rounded-2xl">
                  <div className="relative overflow-hidden bg-[hsl(var(--kata-card)/0.35)]">
                    <img
                      src={product.image}
                      alt={product.name}
                      width={640}
                      height={800}
                      className="h-80 w-full object-contain"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--kata-card))] via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <span className="absolute left-4 top-4 rounded-full bg-[hsl(var(--kata-primary)/0.9)] px-3 py-1 text-xs font-bold text-[hsl(var(--kata-primary-foreground))] backdrop-blur-sm">
                      {product.tag}
                    </span>
                    <button
                      type="button"
                      onClick={model.openShowroom}
                      className="absolute right-4 top-4 rounded-full p-2 opacity-0 transition-all duration-300 hover:scale-110 hover:text-[hsl(var(--kata-primary))] group-hover:opacity-100 kata3d-glass"
                    >
                      <Heart size={16} />
                    </button>
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold">{product.name}</h3>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="font-bold text-[hsl(var(--kata-primary))]">
                        {product.priceLabel}
                        <span className="ml-1 text-xs font-normal text-[hsl(var(--kata-muted-foreground))]">
                          {copy.productPerDay}
                        </span>
                      </p>
                      <button
                        type="button"
                        onClick={model.openShowroom}
                        className="rounded-full px-3 py-1.5 text-xs transition-all duration-300 hover:bg-[hsl(var(--kata-primary))] hover:text-[hsl(var(--kata-primary-foreground))] kata3d-glass"
                      >
                        {copy.productAction}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {visibleProducts.length === 0 ? (
            <p className="mt-6 text-sm text-[hsl(var(--kata-muted-foreground))]">
              {model.copy.emptyFeatured}
            </p>
          ) : null}
        </div>
      </section>

      <section className="relative py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--kata-background))] via-[hsl(var(--kata-secondary)/0.2)] to-[hsl(var(--kata-background))]" />
        <div className="container relative z-10 mx-auto px-4 sm:px-6">
          <div className="kata3d-animate-on-scroll mb-16 text-center">
            <p className="mb-2 text-sm font-medium text-[hsl(var(--kata-primary))]">{copy.servicesLabel}</p>
            <h2 className="text-3xl font-bold md:text-5xl">
              <span data-edit-slot="3d.services.whyChoosePrefix">{copy.whyChoosePrefix}</span>{" "}
              <span className="kata3d-text-gradient break-words">{brandName}</span>?
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {copy.features.map((feature, index) => {
              const Icon = FEATURE_ICONS[index] ?? Sparkles;
              return (
                <article
                  key={feature.title}
                  className="kata3d-animate-on-scroll kata3d-glass-hover rounded-2xl p-8 text-center"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-[hsl(var(--kata-primary)/0.1)] transition-all duration-500 hover:scale-110 hover:bg-[hsl(var(--kata-primary)/0.2)]">
                    <Icon size={24} className="text-[hsl(var(--kata-primary))]" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-[hsl(var(--kata-muted-foreground))]">{feature.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="kata3d-animate-on-scroll mb-16 text-center">
            <p
              data-edit-slot="3d.reviews.label"
              className="mb-2 text-sm font-medium text-[hsl(var(--kata-primary))]"
            >
              {copy.reviewsLabel}
            </p>
            <h2 className="text-3xl font-bold md:text-5xl">
              <span data-edit-slot="3d.reviews.titleLine1">{copy.reviewsTitle1}</span>{" "}
              <span data-edit-slot="3d.reviews.titleLine2" className="kata3d-text-gradient">
                {copy.reviewsTitle2}
              </span>
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {copy.testimonials.map((testimonial, index) => (
              <article
                key={testimonial.name}
                className="kata3d-animate-on-scroll kata3d-glass-hover relative rounded-2xl p-8"
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <Quote className="absolute right-6 top-6 text-[hsl(var(--kata-primary)/0.2)]" size={40} />
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Star key={starIndex} size={14} className="fill-[hsl(var(--kata-primary))] text-[hsl(var(--kata-primary))]" />
                  ))}
                </div>
                <p data-edit-slot={`3d.reviews.${index}.text`} className="mb-6 leading-relaxed">
                  &ldquo;{testimonial.text}&rdquo;
                </p>
                <p data-edit-slot={`3d.reviews.${index}.name`} className="font-semibold">
                  {testimonial.name}
                </p>
                <p
                  data-edit-slot={`3d.reviews.${index}.role`}
                  className="text-sm text-[hsl(var(--kata-muted-foreground))]"
                >
                  {testimonial.role}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--kata-primary)/0.1)] via-[hsl(var(--kata-background))] to-[hsl(var(--kata-primary)/0.05)]" />
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[hsl(var(--kata-primary)/0.1)] blur-[150px]" />

        <div className="container relative z-10 mx-auto px-4 text-center sm:px-6">
          <div className="kata3d-animate-on-scroll mx-auto max-w-2xl space-y-8">
            <h2 className="text-3xl font-bold md:text-5xl">
              <span data-edit-slot="3d.cta.titleLine1">{copy.ctaTitleLine1}</span>
              <br />
              <span data-edit-slot="3d.cta.titleHighlight" className="kata3d-text-gradient">
                {copy.ctaTitleHighlight}
              </span>
              ?
            </h2>
            <p className="text-base text-[hsl(var(--kata-muted-foreground))] sm:text-lg">{copy.ctaSubtitle.replace("KATA", brandName)}</p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href={bookingPath}
                className="kata3d-animate-pulse-glow group flex items-center justify-center gap-2 rounded-lg bg-[hsl(var(--kata-primary))] px-8 py-4 font-medium text-[hsl(var(--kata-primary-foreground))] transition-transform duration-300 hover:scale-105"
              >
                {bookingActionLabel || copy.ctaPrimaryAction}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <button type="button" onClick={model.openShowroom} className="kata3d-glass-hover rounded-lg px-8 py-4 font-medium">
                {copy.ctaSecondaryAction}
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[hsl(var(--kata-border)/0.5)] pb-8 pt-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mb-12 grid gap-10 md:grid-cols-4">
            <div className="space-y-4">
              <h3
                data-edit-slot="3d.footer.brandName"
                className="kata3d-text-gradient break-words text-2xl font-bold"
              >
                {brandName}
              </h3>
              <p
                data-edit-slot="3d.footer.summary"
                className="text-sm leading-relaxed text-[hsl(var(--kata-muted-foreground))]"
              >
                {copy.footerSummary}
              </p>
              <div data-edit-slot="3d.social.links" className="inline-flex">
                <PublicSocialLinks
                  links={model.socialLinks}
                  className="pt-1"
                  linkClassName="border-[hsl(var(--kata-border)/0.75)] bg-[hsl(var(--kata-card)/0.8)] text-[hsl(var(--kata-foreground))] hover:bg-[hsl(var(--kata-secondary)/0.65)] hover:text-[hsl(var(--kata-primary))]"
                />
              </div>
            </div>

            <div data-edit-slot="3d.footer.categories" className="space-y-4">
              <h4 className="font-semibold">{copy.categoriesTitle}</h4>
              {footerCategoryLinks.map((item, index) => (
                <a
                  key={`category-link-${index}-${item.label}`}
                  href={item.href ?? model.showroomPath}
                  className="block text-sm text-[hsl(var(--kata-muted-foreground))] transition-colors hover:text-[hsl(var(--kata-primary))]"
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div data-edit-slot="3d.footer.supportItems" className="space-y-4">
              <h4 className="font-semibold">{copy.supportTitle}</h4>
              {footerSupportLinks.map((item, index) => (
                <a
                  key={`support-link-${index}-${item.label}`}
                  href={item.href ?? model.showroomPath}
                  className="block text-sm text-[hsl(var(--kata-muted-foreground))] transition-colors hover:text-[hsl(var(--kata-primary))]"
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div data-edit-slot="3d.contact.items" className="space-y-4">
              <h4 className="font-semibold">{copy.contactTitle}</h4>
              {contactAddress ? (
                <p
                  className="flex items-start gap-2 break-words text-sm text-[hsl(var(--kata-muted-foreground))]"
                >
                  <MapPin size={14} className="text-[hsl(var(--kata-primary))]" />
                  {contactAddress}
                </p>
              ) : null}
              {contactHotline ? (
                <p
                  className="flex items-start gap-2 break-words text-sm text-[hsl(var(--kata-muted-foreground))]"
                >
                  <Phone size={14} className="text-[hsl(var(--kata-primary))]" />
                  {contactHotlineHref ? (
                    <a href={contactHotlineHref} className="hover:text-[hsl(var(--kata-primary))]">
                      {contactHotline}
                    </a>
                  ) : (
                    contactHotline
                  )}
                </p>
              ) : null}
              {contactEmail ? (
                <p className="flex items-center gap-2 break-words text-sm text-[hsl(var(--kata-muted-foreground))]">
                  <Mail size={14} className="text-[hsl(var(--kata-primary))]" />
                  {contactEmail}
                </p>
              ) : null}
            </div>
          </div>

          <div className="border-t border-[hsl(var(--kata-border)/0.5)] pt-8 text-center text-sm text-[hsl(var(--kata-muted-foreground))]">
            {copy.footerCopyright.replace("KATA", brandName)}
          </div>
        </div>
      </footer>
    </>
  );
}
