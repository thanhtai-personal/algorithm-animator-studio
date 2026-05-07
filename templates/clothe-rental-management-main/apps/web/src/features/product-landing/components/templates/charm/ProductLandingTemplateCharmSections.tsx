"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Heart, Search, Sparkles, Star } from "lucide-react";
import { PublicSocialLinks } from "@/components/layout/PublicSocialLinks";
import { parseFooterLinkEntry } from "@/lib/footerLinkEntries";
import type { ProductLandingTemplateModel } from "../shared/productLandingTemplateModel";
import { FEATURE_ICONS, type TemplateCopy } from "./productLandingTemplateCharm.config";

interface ProductLandingTemplateCharmSectionsProps {
  bookingActionLabel: string;
  bookingPath: string;
  brandName: string;
  copy: TemplateCopy;
  heroImage: string;
  likedProductIds: Record<string, boolean>;
  model: ProductLandingTemplateModel;
  onToggleLike: (productId: string) => void;
}

function toTelHref(value: string): string | null {
  const compact = value.replace(/[^\d+]/g, "");
  return compact.length > 0 ? `tel:${compact}` : null;
}

function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);
  const animatedRef = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || animatedRef.current) return;
        animatedRef.current = true;

        const durationMs = 2000;
        const startTime = performance.now();

        const tick = (now: number) => {
          const progress = Math.min((now - startTime) / durationMs, 1);
          const eased = 1 - (1 - progress) ** 3;
          setCount(Math.floor(target * eased));
          if (progress < 1) {
            requestAnimationFrame(tick);
          }
        };

        requestAnimationFrame(tick);
      },
      { threshold: 0.5 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref} className="text-3xl font-bold text-primary sm:text-4xl md:text-5xl">
      {count.toLocaleString()}
      {suffix}
    </div>
  );
}

export function ProductLandingTemplateCharmSections({
  bookingActionLabel,
  bookingPath,
  brandName,
  copy,
  heroImage,
  likedProductIds,
  model,
  onToggleLike,
}: ProductLandingTemplateCharmSectionsProps) {
  const footerAddress = model.contactInfo.storeAddress ?? "";
  const footerHotline = model.contactInfo.hotline ?? "";
  const footerHotlineHref = footerHotline ? toTelHref(footerHotline) : null;
  const footerEmail = model.contactInfo.email ?? copy.footerContactLines[2] ?? "";
  const footerProductLinks = copy.footerProducts
    .map(parseFooterLinkEntry)
    .filter((entry) => entry.label.length > 0);
  const footerSupportLinks = copy.footerSupport
    .map(parseFooterLinkEntry)
    .filter((entry) => entry.label.length > 0);

  return (
    <>
      <section className="relative overflow-hidden">
        <span
          data-edit-slot="charm.meta.pageLogo"
          aria-hidden
          className="pointer-events-none absolute left-5 top-5 h-1 w-1 opacity-0"
        />
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt={copy.heroLine1}
            data-edit-slot="charm.hero.image"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background" />
        </div>

        <div className="relative container mx-auto px-4 py-16 text-center sm:py-20 md:py-32">
          {model.isFallback ? (
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-primary">
              {model.copy.fallbackNotice}
            </p>
          ) : null}

          <div className="kata-charm-animate-slide-up mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 backdrop-blur-sm">
            <Sparkles className="kata-charm-animate-sparkle h-4 w-4 text-primary" />
            <span data-edit-slot="charm.hero.badge" className="text-sm font-semibold text-primary">
              {copy.heroBadge}
            </span>
            <Sparkles className="kata-charm-animate-sparkle h-4 w-4 text-primary" />
          </div>

          <h1 className="kata-charm-animate-slide-up-delay-1 mb-6 text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-6xl lg:text-7xl">
            <span data-edit-slot="charm.hero.line1">{copy.heroLine1}</span>
            <br />
            <span data-edit-slot="charm.hero.line2" className="text-primary">
              {copy.heroLine2}
            </span>
            <span className="kata-charm-animate-bounce-soft ml-2 inline-block">✨</span>
          </h1>

          <p
            data-edit-slot="charm.hero.subtitle"
            className="kata-charm-animate-slide-up-delay-2 mx-auto mb-8 max-w-2xl text-base text-muted-foreground sm:mb-10 sm:text-lg md:text-xl"
          >
            {copy.heroSubtitle}
          </p>

          <div className="kata-charm-animate-slide-up-delay-3 mx-auto mb-8 max-w-xl">
            <div className="kata-charm-shadow-card flex items-center overflow-hidden rounded-full border border-border bg-card p-1.5">
              <Search className="ml-4 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                readOnly
                value={copy.searchPlaceholder}
                onClick={model.openShowroom}
                className="flex-1 bg-transparent px-3 py-2.5 text-xs text-muted-foreground outline-none sm:px-4 sm:py-3 sm:text-sm"
                aria-label={copy.searchPlaceholder}
              />
              <button
                type="button"
                onClick={model.openShowroom}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground transition-all hover:scale-105 hover:opacity-90 sm:gap-2 sm:px-6 sm:py-3 sm:text-sm"
              >
                {copy.heroSearchAction}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="kata-charm-animate-slide-up-delay-4">
            <Link
              href={bookingPath}
              className="kata-charm-gradient-cute kata-charm-shadow-cute inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold text-white transition-all hover:scale-105"
            >
              {bookingActionLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-accent/55 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            {copy.stats.map((stat) => (
              <article
                key={stat.label}
                className="kata-charm-hover-lift kata-charm-shadow-cute rounded-2xl border border-border bg-card p-6 text-center"
              >
                <p className="kata-charm-animate-bounce-soft mb-2 text-3xl">{stat.emoji}</p>
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                <p className="mt-2 text-sm font-medium text-muted-foreground">{stat.label}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                data-edit-slot="charm.featured.title"
                className="text-3xl font-bold text-foreground md:text-4xl"
              >
                {copy.featuredTitle} ✨
              </h2>
              <p data-edit-slot="charm.featured.subtitle" className="mt-2 text-muted-foreground">
                {copy.featuredSubtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={model.openShowroom}
              className="hidden items-center gap-2 font-semibold text-primary transition-all hover:gap-3 sm:flex"
            >
              {copy.featuredShowMore} <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div
            data-edit-slot="charm.featured.products"
            className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6"
          >
            {copy.products.map((product) => {
              const liked = Boolean(likedProductIds[product.id]);
              return (
                <article
                  key={product.id}
                  className="kata-charm-hover-lift kata-charm-shadow-cute group overflow-hidden rounded-2xl border border-border bg-card"
                >
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                      {product.tag}
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleLike(product.id)}
                      className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-card/85 backdrop-blur-sm transition-all hover:scale-110"
                      aria-label="Toggle like"
                    >
                      <Heart className={`h-4 w-4 ${liked ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 translate-y-full p-3 transition-transform duration-300 group-hover:translate-y-0">
                      <button
                        type="button"
                        onClick={model.openShowroom}
                        className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                      >
                        {copy.rentNowAction} 💖
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="mb-1 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                      {product.name}
                    </h3>
                    <p className="font-bold text-primary">{product.price}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-accent/35 py-20">
        <div className="container mx-auto px-4">
          <h2
            data-edit-slot="charm.features.title"
            className="mb-4 text-center text-2xl font-bold text-foreground sm:text-3xl md:text-4xl"
          >
            {copy.featuresTitle} 💖
          </h2>
          <p
            data-edit-slot="charm.features.subtitle"
            className="mx-auto mb-12 max-w-lg text-center text-muted-foreground"
          >
            {copy.featuresSubtitle}
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            {copy.features.map((feature, index) => {
              const Icon = FEATURE_ICONS[index] ?? Sparkles;
              return (
                <article
                  key={feature.title}
                  className="kata-charm-hover-lift kata-charm-shadow-cute group rounded-2xl border border-border bg-card p-8 text-center"
                >
                  <div
                    className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-white transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${feature.gradientClass}`}
                  >
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3
                    data-edit-slot={`charm.features.${index}.title`}
                    className="mb-3 text-lg font-bold text-foreground"
                  >
                    {feature.title}
                  </h3>
                  <p
                    data-edit-slot={`charm.features.${index}.description`}
                    className="text-sm leading-relaxed text-muted-foreground"
                  >
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2
            data-edit-slot="charm.testimonials.title"
            className="mb-4 text-center text-2xl font-bold text-foreground sm:text-3xl md:text-4xl"
          >
            {copy.testimonialsTitle} 💬
          </h2>
          <p
            data-edit-slot="charm.testimonials.subtitle"
            className="mb-12 text-center text-muted-foreground"
          >
            {copy.testimonialsSubtitle}
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            {copy.testimonials.map((item, index) => (
              <article
                key={item.name}
                className="kata-charm-hover-lift kata-charm-shadow-cute relative rounded-2xl border border-border bg-card p-8"
              >
                <div className="kata-charm-text-accent absolute left-6 top-4 text-6xl text-primary/20">
                  &quot;
                </div>
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: item.stars }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p
                  data-edit-slot={`charm.testimonials.${index}.quote`}
                  className="relative z-10 mb-6 leading-relaxed text-foreground"
                >
                  {item.quote}
                </p>
                <p data-edit-slot={`charm.testimonials.${index}.name`} className="font-bold text-foreground">
                  {item.name}
                </p>
                <p
                  data-edit-slot={`charm.testimonials.${index}.role`}
                  className="text-sm text-muted-foreground"
                >
                  {item.role}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="kata-charm-gradient-cute relative overflow-hidden rounded-3xl p-8 text-center sm:p-10 md:p-16">
            <div className="absolute left-10 top-6">
              <Sparkles className="kata-charm-animate-float h-8 w-8 text-white/35" />
            </div>
            <div className="absolute bottom-10 right-14">
              <Sparkles
                className="kata-charm-animate-float h-6 w-6 text-white/35"
                style={{ animationDelay: "1s" }}
              />
            </div>
            <div className="absolute right-1/4 top-1/2">
              <span className="kata-charm-animate-bounce-soft text-2xl text-white/70">✨</span>
            </div>

            <h2 className="relative z-10 mb-4 text-2xl font-bold text-white sm:text-3xl md:text-4xl">
              {copy.ctaTitle} 💖
            </h2>
            <p className="relative z-10 mx-auto mb-8 max-w-lg text-white/85">{copy.ctaSubtitle}</p>

            <button
              type="button"
              onClick={model.openShowroom}
              className="kata-charm-shadow-card relative z-10 inline-flex items-center gap-2 rounded-full bg-card px-8 py-4 font-bold text-primary transition-all hover:scale-105"
            >
              {copy.ctaShowroomAction}
              <ArrowRight className="h-5 w-5" />
            </button>

            <Link
              href={bookingPath}
              className="ml-0 mt-4 inline-flex items-center justify-center rounded-full border border-primary-foreground/55 px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary-foreground/10 md:ml-4 md:mt-0"
            >
              {bookingActionLabel}
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-accent/55 py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8 grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span
                  data-edit-slot="charm.footer.brandName"
                  className="break-words text-xl font-bold text-primary"
                >
                  {brandName}
                </span>
                <span className="kata-charm-text-accent text-lg text-muted-foreground">Shop</span>
              </div>
              <p
                data-edit-slot="charm.footer.summary"
                className="text-sm leading-relaxed text-muted-foreground"
              >
                {copy.footerSummary} ✨
              </p>
              <div data-edit-slot="charm.social.links" className="inline-flex">
                <PublicSocialLinks
                  links={model.socialLinks}
                  className="mt-4"
                  linkClassName="border-border bg-background/80 text-foreground hover:bg-accent hover:text-primary"
                />
              </div>
            </div>

            <div data-edit-slot="charm.footer.products">
              <h4 className="mb-4 font-bold text-foreground">{copy.footerProductsTitle}</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                {footerProductLinks.map((item, index) => (
                  <a
                    key={`footer-product-link-${index}-${item.label}`}
                    href={item.href ?? model.showroomPath}
                    className="block transition-colors hover:text-primary"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            <div data-edit-slot="charm.footer.support">
              <h4 className="mb-4 font-bold text-foreground">{copy.footerSupportTitle}</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                {footerSupportLinks.map((item, index) => (
                  <a
                    key={`footer-support-link-${index}-${item.label}`}
                    href={item.href ?? model.showroomPath}
                    className="block transition-colors hover:text-primary"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            <div data-edit-slot="charm.contact.items">
              <h4 className="mb-4 font-bold text-foreground">{copy.footerContactTitle}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {footerAddress ? <li className="break-words">📍 {footerAddress}</li> : null}
                {footerHotline ? (
                  <li className="break-words">
                    📞{" "}
                    {footerHotlineHref ? (
                      <a href={footerHotlineHref} className="hover:text-primary">
                        {footerHotline}
                      </a>
                    ) : (
                      footerHotline
                    )}
                  </li>
                ) : null}
                {footerEmail ? <li>📧 {footerEmail}</li> : null}
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-6 text-center text-sm text-muted-foreground">
            {copy.footerMadeWith}{" "}
            <Heart className="mx-1 inline h-3 w-3 fill-primary text-primary" />
            {brandName} Shop © 2026
          </div>
        </div>
      </footer>
    </>
  );
}
