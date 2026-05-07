"use client";

import Link from "next/link";
import {
  ArrowRight,
  Award,
  Clock,
  Heart,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";
import { PublicSocialLinks } from "@/components/layout/PublicSocialLinks";
import type { ProductLandingModernTemplateCopy } from "@/features/product-landing/config/productLandingThemeModern";
import { parseFooterLinkEntry } from "@/lib/footerLinkEntries";
import type { PublicContactInfo as PublicContactInfoValue } from "@/lib/publicContactInfo";
import type { PublicSocialLinks as PublicSocialLinksValue } from "@/lib/publicSocialLinks";
import { normalizeRenderableImageSrc } from "@/lib/imageSource";
import { useScrollRevealModern } from "./useScrollRevealModern";

interface ProductLandingTemplateModernSectionsProps {
  copy: ProductLandingModernTemplateCopy;
  authHref: string;
  bookingActionLabel: string;
  bookingPath: string;
  contactInfo: PublicContactInfoValue;
  homeHref: string;
  onOpenShowroom: () => void;
  showroomHref: string;
  socialLinks: PublicSocialLinksValue;
}

export function ProductLandingTemplateModernSections({
  copy,
  authHref,
  bookingActionLabel,
  bookingPath,
  contactInfo,
  homeHref,
  onOpenShowroom,
  showroomHref,
  socialLinks,
}: ProductLandingTemplateModernSectionsProps) {
  const defaultFeaturedImagePaths = [
    "/template-assets/kata-modern/product1.jpg",
    "/template-assets/kata-modern/product2.jpg",
    "/template-assets/kata-modern/product3.jpg",
    "/template-assets/kata-modern/product4.jpg",
  ];
  const statsVisible = useScrollRevealModern("modern-stats");
  const productsVisible = useScrollRevealModern("modern-products");
  const featuresVisible = useScrollRevealModern("modern-features");
  const testimonialsVisible = useScrollRevealModern("modern-testimonials");
  const ctaVisible = useScrollRevealModern("modern-cta");

  const footerLinkHrefs = [homeHref, showroomHref, showroomHref, authHref];
  const footerAddress = contactInfo.storeAddress;
  const footerPhone = contactInfo.hotline;
  const footerEmail = contactInfo.email ?? copy.footer.email;
  const footerLinks = copy.footer.links
    .map(parseFooterLinkEntry)
    .filter((entry) => entry.label.length > 0);
  const footerSupportLinks = copy.footer.supportItems
    .map(parseFooterLinkEntry)
    .filter((entry) => entry.label.length > 0);
  const statIcons = [Package, Heart, Award, Clock];
  const featureIcons = [Truck, ShieldCheck, MessageCircle, Sparkles];

  return (
    <>
      <section className="relative flex min-h-[72svh] items-center justify-center overflow-hidden sm:min-h-screen">
        <span
          data-edit-slot="modern.meta.pageLogo"
          aria-hidden
          className="pointer-events-none absolute left-5 top-5 h-1 w-1 opacity-0"
        />
        <div className="absolute inset-0">
          <img
            src={copy.hero.heroImagePath}
            alt=""
            loading="eager"
            fetchPriority="high"
            decoding="async"
            data-edit-slot="modern.hero.image"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-foreground/60" />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/30 via-transparent to-foreground/80" />
        </div>

        <div className="relative z-10 container mx-auto px-4 pt-6 text-center sm:pt-10">
          <div
            className="kata-modern-animate-fade-up mb-6 inline-block rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-5 py-2 backdrop-blur-md"
            style={{ animationDelay: "0.2s" }}
          >
            <span
              data-edit-slot="modern.hero.badge"
              className="text-sm font-medium uppercase tracking-wider text-primary-foreground"
            >
              {copy.hero.badge}
            </span>
          </div>

          <h1
            className="kata-modern-font-serif kata-modern-animate-fade-up mb-6 text-3xl font-bold leading-[1.1] text-primary-foreground sm:text-5xl md:text-7xl lg:text-8xl"
            style={{ animationDelay: "0.4s" }}
          >
            <span data-edit-slot="modern.hero.line1">{copy.hero.line1}</span>
            <br />
            <span data-edit-slot="modern.hero.line2" className="font-normal italic">
              {copy.hero.line2}
            </span>
          </h1>

          <p
            data-edit-slot="modern.hero.subtitle"
            className="kata-modern-animate-fade-up mx-auto mb-8 max-w-xl text-base text-primary-foreground/70 sm:mb-10 md:text-lg"
            style={{ animationDelay: "0.6s" }}
          >
            {copy.hero.subtitle}
          </p>

          <div
            className="kata-modern-animate-fade-up flex flex-col items-center justify-center gap-4 sm:flex-row"
            style={{ animationDelay: "0.8s" }}
          >
            <a
              href="#modern-products"
              className="kata-modern-btn-primary-glow inline-flex items-center gap-2 rounded-xl px-8 py-4 text-sm font-medium"
            >
              {copy.hero.primaryActionLabel}
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href={bookingPath}
              className="rounded-xl border border-primary-foreground/30 px-8 py-4 text-sm font-medium text-primary-foreground transition-all duration-300 hover:bg-primary-foreground/10"
            >
              {bookingActionLabel || copy.hero.secondaryActionLabel}
            </Link>
          </div>
        </div>

        <div
          className="kata-modern-animate-fade-up absolute bottom-8 left-1/2 -translate-x-1/2"
          style={{ animationDelay: "1.2s" }}
        >
          <div className="flex h-10 w-6 justify-center rounded-full border-2 border-primary-foreground/40 pt-2">
            <div className="h-3 w-1 animate-bounce rounded-full bg-primary-foreground/60" />
          </div>
        </div>
      </section>

      <section id="modern-stats" className="bg-secondary/50 py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            {copy.stats.map((stat, index) => {
              const Icon = statIcons[index] ?? Package;
              return (
              <article
                key={stat.label}
                className={`kata-modern-hover-lift rounded-2xl bg-card p-6 text-center transition-all duration-700 ${
                  statsVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                }`}
                style={{ transitionDelay: `${index * 0.1}s` }}
              >
                <Icon className="mx-auto mb-3 h-8 w-8 text-primary" />
                <p className="kata-modern-font-serif mb-1 text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="modern-products" className="py-24">
        <div className="container mx-auto px-4">
          <div className="mb-10 flex flex-col gap-3 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span
                data-edit-slot="modern.products.label"
                className="text-sm font-semibold uppercase tracking-wider text-primary"
              >
                {copy.products.label}
              </span>
              <h2
                data-edit-slot="modern.products.title"
                className="kata-modern-font-serif mt-2 text-3xl font-bold text-foreground md:text-5xl"
              >
                {copy.products.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onOpenShowroom}
              className="hidden items-center gap-2 text-sm font-medium text-primary transition-all duration-300 hover:gap-3 sm:flex"
            >
              {copy.products.showMoreActionLabel}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div
            data-edit-slot="modern.featured.products"
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {copy.featuredCards.map((product, index) => {
              const fallbackImagePath =
                defaultFeaturedImagePaths[index % defaultFeaturedImagePaths.length] ??
                "/template-assets/kata-modern/product1.jpg";
              const productImageSrc =
                normalizeRenderableImageSrc(product.imagePath) ?? fallbackImagePath;

              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={onOpenShowroom}
                  className={`group cursor-pointer text-left transition-all duration-700 ${
                    productsVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                  }`}
                  style={{ transitionDelay: `${index * 0.15}s` }}
                >
                  <div className="kata-modern-product-card-img relative mb-4 aspect-[3/4] rounded-2xl bg-secondary">
                    <img
                      src={productImageSrc}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full rounded-2xl object-cover"
                    />
                    {product.tag ? (
                      <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                        {product.tag}
                      </span>
                    ) : null}
                    <div className="absolute inset-0 rounded-2xl bg-foreground/0 transition-colors duration-500 group-hover:bg-foreground/10" />
                  </div>
                  <h3 className="font-medium text-foreground transition-colors duration-300 group-hover:text-primary">
                    {product.name}
                  </h3>
                  <p className="mt-1 font-semibold text-primary">{product.price}</p>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onOpenShowroom}
            className="mt-8 flex items-center justify-center gap-2 text-sm font-medium text-primary sm:hidden"
          >
            {copy.products.showMoreActionLabel}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section id="modern-features" className="bg-secondary/30 py-24">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              {copy.features.label}
            </span>
            <h2 className="kata-modern-font-serif mt-2 text-3xl font-bold text-foreground md:text-5xl">
              {copy.features.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {copy.featureItems.map((feature, index) => {
              const Icon = featureIcons[index] ?? Sparkles;
              return (
              <article
                key={feature.title}
                className={`kata-modern-glass-card kata-modern-hover-lift p-8 text-center transition-all duration-700 ${
                  featuresVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                }`}
                style={{ transitionDelay: `${index * 0.1}s` }}
              >
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="kata-modern-font-serif mb-2 text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="modern-testimonials" className="py-24">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <span
              data-edit-slot="modern.testimonials.label"
              className="text-sm font-semibold uppercase tracking-wider text-primary"
            >
              {copy.testimonials.label}
            </span>
            <h2
              data-edit-slot="modern.testimonials.title"
              className="kata-modern-font-serif mt-2 text-3xl font-bold text-foreground md:text-5xl"
            >
              {copy.testimonials.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {copy.testimonialItems.map((testimonial, index) => (
              <article
                key={testimonial.name}
                className={`kata-modern-glass-card kata-modern-hover-lift p-8 transition-all duration-700 ${
                  testimonialsVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-8 opacity-0"
                }`}
                style={{ transitionDelay: `${index * 0.15}s` }}
              >
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, starIndex) => (
                    <Star
                      key={`${testimonial.name}-${starIndex}`}
                      className="h-4 w-4 fill-warning text-warning"
                    />
                  ))}
                </div>
                <p
                  data-edit-slot={`modern.testimonials.${index}.text`}
                  className="mb-6 italic leading-relaxed text-foreground"
                >
                  &ldquo;{testimonial.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-sm font-semibold text-primary">
                      {testimonial.name[0]}
                    </span>
                  </div>
                  <span
                    data-edit-slot={`modern.testimonials.${index}.name`}
                    className="font-semibold text-foreground"
                  >
                    {testimonial.name}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="modern-cta" className="py-24">
        <div className="container mx-auto px-4">
          <div
            className={`relative overflow-hidden rounded-3xl p-8 text-center transition-all duration-1000 sm:p-10 md:p-20 ${
              ctaVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--primary) / 0.9), hsl(var(--accent) / 0.82))",
            }}
          >
            <div className="absolute inset-0 opacity-20">
              <div className="kata-modern-floating absolute left-10 top-10 h-40 w-40 rounded-full bg-primary-foreground/20" />
              <div
                className="kata-modern-floating absolute bottom-10 right-10 h-60 w-60 rounded-full bg-primary-foreground/10"
                style={{ animationDelay: "3s" }}
              />
            </div>

            <div className="relative z-10">
              <h2 className="kata-modern-font-serif mb-4 text-2xl font-bold text-primary-foreground sm:text-3xl md:text-5xl">
                {copy.cta.title}
              </h2>
              <p className="mx-auto mb-8 max-w-md text-primary-foreground/80">{copy.cta.subtitle}</p>
              <button
                type="button"
                onClick={onOpenShowroom}
                className="inline-flex items-center gap-2 rounded-xl bg-primary-foreground px-8 py-4 font-medium text-foreground transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                {copy.cta.actionLabel}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-foreground pb-8 pt-16 text-primary-foreground/70">
        <div className="container mx-auto px-4">
          <div className="mb-12 grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">
            <div className="md:col-span-2">
              <h3
                data-edit-slot="modern.footer.brandName"
                className="kata-modern-font-serif mb-4 break-words text-2xl font-bold text-primary-foreground"
              >
                {copy.pageName}
              </h3>
              <p
                data-edit-slot="modern.footer.summary"
                className="mb-6 max-w-sm text-sm leading-relaxed"
              >
                {copy.footer.summary}
              </p>
              <div data-edit-slot="modern.contact.items" className="flex flex-col gap-3 text-sm">
                {footerAddress ? (
                  <div className="flex items-start gap-2 break-words">
                    <MapPin className="h-4 w-4 text-primary" />
                    {footerAddress}
                  </div>
                ) : null}
                {footerPhone ? (
                  <div className="flex items-start gap-2 break-words">
                    <Phone className="h-4 w-4 text-primary" />
                    {footerPhone}
                  </div>
                ) : null}
                {footerEmail ? (
                  <div className="flex items-center gap-2 break-words">
                    <Mail className="h-4 w-4 text-primary" />
                    {footerEmail}
                  </div>
                ) : null}
              </div>
              <div data-edit-slot="modern.social.links" className="inline-flex">
                <PublicSocialLinks
                  links={socialLinks}
                  className="mt-4"
                  linkClassName="border-primary-foreground/20 bg-primary-foreground/5 text-primary-foreground/80 hover:bg-primary-foreground/15 hover:text-primary-foreground"
                />
              </div>
            </div>

            <div data-edit-slot="modern.footer.links">
              <h4 className="mb-4 font-semibold text-primary-foreground">{copy.footer.linksTitle}</h4>
              <nav className="flex flex-col gap-2 text-sm">
                {footerLinks.map((entry, index) => (
                  <a
                    key={`modern-footer-link-${index}-${entry.label}`}
                    href={entry.href ?? footerLinkHrefs[index] ?? showroomHref}
                    className="transition-colors hover:text-primary-foreground"
                  >
                    {entry.label}
                  </a>
                ))}
              </nav>
            </div>

            <div data-edit-slot="modern.footer.supportItems">
              <h4 className="mb-4 font-semibold text-primary-foreground">{copy.footer.supportTitle}</h4>
              <nav className="flex flex-col gap-2 text-sm">
                {footerSupportLinks.map((entry, index) => (
                  <a
                    key={`modern-footer-support-link-${index}-${entry.label}`}
                    href={entry.href ?? showroomHref}
                    className="text-left transition-colors hover:text-primary-foreground"
                  >
                    {entry.label}
                  </a>
                ))}
              </nav>
            </div>
          </div>

          <div className="border-t border-primary-foreground/10 pt-8 text-center text-xs">
            {copy.footer.copyright}
          </div>
        </div>
      </footer>
    </>
  );
}
