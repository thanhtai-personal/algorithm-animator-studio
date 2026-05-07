"use client";

import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type { AppLocale } from "@/constants/locale";
import {
  isProductLanding3DTemplateCode,
  type ProductLanding3DThemeConfig,
  type LocalizedText as ProductLanding3DLocalizedText,
} from "@/features/product-landing/config/productLandingTheme3D";
import {
  isProductLandingCharmTemplateCode,
  type ProductLandingCharmThemeConfig,
  type LocalizedText as ProductLandingCharmLocalizedText,
} from "@/features/product-landing/config/productLandingThemeCharm";
import {
  isProductLandingModernTemplateCode,
  type ProductLandingModernThemeConfig,
  type LocalizedText as ProductLandingModernLocalizedText,
} from "@/features/product-landing/config/productLandingThemeModern";
import type { ProductLandingTemplateModel } from "@/features/product-landing/components/templates/shared/productLandingTemplateModel";
import { showroomClientService } from "@/features/showroom/services/showroomClientService";
import { parseFooterLinkEntry } from "@/lib/footerLinkEntries";
import { parsePublicContactInfo } from "@/lib/publicContactInfo";
import { parsePublicSocialLinks } from "@/lib/publicSocialLinks";
import type {
  SettingLocale,
  SettingsShowroomFeaturedProductOptionDto,
} from "@/types/settingsModule";

type VisualEditorTemplateKind = "theme-charm" | "theme-3d" | "theme-modern" | "legacy-default";
type VisualEditorMode = "visual" | "legacy";
type VisualEditorNodeType =
  | "text"
  | "textarea"
  | "image"
  | "featuredProducts"
  | "socialLinks"
  | "textList"
  | "contactInfo";
type SocialLinkKey = "facebook" | "tiktok" | "zalo" | "telegram";
type ContactInfoKey = "hotline" | "storeAddress" | "email";

interface VisualEditorNodeDefinition {
  id: string;
  type: VisualEditorNodeType;
  label: Record<AppLocale, string>;
  description: Record<AppLocale, string>;
  position: {
    topPercent: number;
    leftPercent: number;
  };
}

interface UseSettingsShowroomVisualEditorParams {
  locale: AppLocale;
  pageLocale: SettingLocale;
  templateCode: string | null | undefined;
  branchLabel: string;
  isThemeCharmSelected: boolean;
  isTheme3DSelected: boolean;
  isThemeModernSelected: boolean;
  themeCharmDraft: ProductLandingCharmThemeConfig;
  setThemeCharmDraft: Dispatch<SetStateAction<ProductLandingCharmThemeConfig>>;
  theme3dDraft: ProductLanding3DThemeConfig;
  setTheme3dDraft: Dispatch<SetStateAction<ProductLanding3DThemeConfig>>;
  themeModernDraft: ProductLandingModernThemeConfig;
  setThemeModernDraft: Dispatch<SetStateAction<ProductLandingModernThemeConfig>>;
  heroBadge: string;
  setHeroBadge: Dispatch<SetStateAction<string>>;
  heroHeading: string;
  setHeroHeading: Dispatch<SetStateAction<string>>;
  heroSubheading: string;
  setHeroSubheading: Dispatch<SetStateAction<string>>;
  heroSearchPlaceholder: string;
  setHeroSearchPlaceholder: Dispatch<SetStateAction<string>>;
  featuredTitle: string;
  setFeaturedTitle: Dispatch<SetStateAction<string>>;
  featuredShowMoreLabel: string;
  setFeaturedShowMoreLabel: Dispatch<SetStateAction<string>>;
  featuredProductIds: string[];
  setFeaturedProductIds: Dispatch<SetStateAction<string[]>>;
  pageNameVi: string;
  setPageNameVi: Dispatch<SetStateAction<string>>;
  pageNameEn: string;
  setPageNameEn: Dispatch<SetStateAction<string>>;
  pageLogoUrl: string;
  setPageLogoUrl: Dispatch<SetStateAction<string>>;
  perkBundles: Array<{
    viTitle: string;
    viDescription: string;
    enTitle: string;
    enDescription: string;
  }>;
  testimonialBundles: Array<{
    viName: string;
    viText: string;
    enName: string;
    enText: string;
  }>;
  updateTestimonialBundle: (
    index: number,
    patch: Partial<{
      viName: string;
      viText: string;
      enName: string;
      enText: string;
    }>
  ) => void;
  featuredProductOptions: SettingsShowroomFeaturedProductOptionDto[];
  socialLinksDraft: {
    facebook: string;
    tiktok: string;
    zalo: string;
    telegram: string;
  };
  updateSocialLink: (key: SocialLinkKey, value: string) => void;
  updateContactInfo: (key: ContactInfoKey, value: string) => void;
  contactInfoDraft: {
    hotline: string;
    storeAddress: string;
    email: string;
  };
}

const FALLBACK_COPY = {
  vi: {
    fallbackNotice: "Đang hiển thị bản nháp cấu hình giao diện.",
    emptyFeatured: "Chưa có sản phẩm nổi bật.",
    bookingActionLabel: "Đặt lịch makeup",
    heroBadge: "Bộ sưu tập mới",
    heroHeading: "Trang phục cao cấp cho mọi dịp đặc biệt",
    heroSubheading:
      "Áo dài, vest, đầm dạ hội với trải nghiệm thuê nhanh và linh hoạt.",
    searchPlaceholder: "Tìm trang phục bạn muốn thử...",
    featuredTitle: "Sản phẩm nổi bật",
    featuredShowMoreLabel: "Xem thêm",
  },
  en: {
    fallbackNotice: "Draft theme preview mode.",
    emptyFeatured: "No featured products yet.",
    bookingActionLabel: "Book makeup",
    heroBadge: "New collection",
    heroHeading: "Premium outfits for every special occasion",
    heroSubheading:
      "Ao dai, suits, and evening dresses with a fast and flexible rental flow.",
    searchPlaceholder: "Search outfits you want to try...",
    featuredTitle: "Featured products",
    featuredShowMoreLabel: "Show more",
  },
} as const;

const VISUAL_EDITOR_NODES: Record<VisualEditorTemplateKind, VisualEditorNodeDefinition[]> = {
  "theme-charm": [
    {
      id: "charm.hero.badge",
      type: "text",
      label: { vi: "Hero badge", en: "Hero badge" },
      description: { vi: "Nhãn badge ở hero", en: "Hero badge label" },
      position: { topPercent: 12, leftPercent: 52 },
    },
    {
      id: "charm.hero.line1",
      type: "text",
      label: { vi: "Hero dòng 1", en: "Hero line 1" },
      description: { vi: "Dòng headline đầu", en: "First headline line" },
      position: { topPercent: 20, leftPercent: 40 },
    },
    {
      id: "charm.hero.line2",
      type: "text",
      label: { vi: "Hero dòng 2", en: "Hero line 2" },
      description: { vi: "Dòng headline nhấn", en: "Highlighted headline line" },
      position: { topPercent: 24, leftPercent: 64 },
    },
    {
      id: "charm.hero.subtitle",
      type: "textarea",
      label: { vi: "Hero mô tả", en: "Hero subtitle" },
      description: { vi: "Mô tả dưới headline", en: "Subtitle under headline" },
      position: { topPercent: 30, leftPercent: 54 },
    },
    {
      id: "charm.hero.image",
      type: "image",
      label: { vi: "Ảnh hero", en: "Hero image" },
      description: { vi: "Ảnh nền hero", en: "Hero background image" },
      position: { topPercent: 7, leftPercent: 10 },
    },
    {
      id: "charm.meta.pageLogo",
      type: "image",
      label: { vi: "Logo trang", en: "Page logo" },
      description: { vi: "Logo hiển thị trên header", en: "Logo shown on header" },
      position: { topPercent: 4, leftPercent: 8 },
    },
    {
      id: "charm.featured.title",
      type: "text",
      label: { vi: "Tiêu đề sản phẩm nổi bật", en: "Featured title" },
      description: { vi: "Tiêu đề section featured", en: "Featured section title" },
      position: { topPercent: 52, leftPercent: 27 },
    },
    {
      id: "charm.featured.subtitle",
      type: "textarea",
      label: { vi: "Mô tả sản phẩm nổi bật", en: "Featured subtitle" },
      description: { vi: "Mô tả section featured", en: "Featured section subtitle" },
      position: { topPercent: 56, leftPercent: 34 },
    },
    {
      id: "charm.featured.products",
      type: "featuredProducts",
      label: { vi: "Danh sách sản phẩm nổi bật", en: "Featured products list" },
      description: { vi: "Chọn sản phẩm hiển thị", en: "Select products to render" },
      position: { topPercent: 61, leftPercent: 78 },
    },
    {
      id: "charm.features.title",
      type: "text",
      label: { vi: "Tiêu đề vì sao chọn", en: "Why choose title" },
      description: { vi: "Tiêu đề section lý do chọn", en: "Why choose section heading" },
      position: { topPercent: 70, leftPercent: 44 },
    },
    {
      id: "charm.features.subtitle",
      type: "textarea",
      label: { vi: "Mô tả vì sao chọn", en: "Why choose subtitle" },
      description: { vi: "Mô tả dưới tiêu đề lý do chọn", en: "Subtitle under why choose heading" },
      position: { topPercent: 73, leftPercent: 44 },
    },
    {
      id: "charm.features.0.title",
      type: "text",
      label: { vi: "Lý do 1 - Tiêu đề", en: "Reason 1 - Title" },
      description: { vi: "Tiêu đề card lý do 1", en: "Reason card 1 title" },
      position: { topPercent: 76, leftPercent: 20 },
    },
    {
      id: "charm.features.0.description",
      type: "textarea",
      label: { vi: "Lý do 1 - Mô tả", en: "Reason 1 - Description" },
      description: { vi: "Mô tả card lý do 1", en: "Reason card 1 description" },
      position: { topPercent: 79, leftPercent: 20 },
    },
    {
      id: "charm.features.1.title",
      type: "text",
      label: { vi: "Lý do 2 - Tiêu đề", en: "Reason 2 - Title" },
      description: { vi: "Tiêu đề card lý do 2", en: "Reason card 2 title" },
      position: { topPercent: 76, leftPercent: 50 },
    },
    {
      id: "charm.features.1.description",
      type: "textarea",
      label: { vi: "Lý do 2 - Mô tả", en: "Reason 2 - Description" },
      description: { vi: "Mô tả card lý do 2", en: "Reason card 2 description" },
      position: { topPercent: 79, leftPercent: 50 },
    },
    {
      id: "charm.features.2.title",
      type: "text",
      label: { vi: "Lý do 3 - Tiêu đề", en: "Reason 3 - Title" },
      description: { vi: "Tiêu đề card lý do 3", en: "Reason card 3 title" },
      position: { topPercent: 76, leftPercent: 80 },
    },
    {
      id: "charm.features.2.description",
      type: "textarea",
      label: { vi: "Lý do 3 - Mô tả", en: "Reason 3 - Description" },
      description: { vi: "Mô tả card lý do 3", en: "Reason card 3 description" },
      position: { topPercent: 79, leftPercent: 80 },
    },
    {
      id: "charm.testimonials.title",
      type: "text",
      label: { vi: "Tiêu đề đánh giá", en: "Testimonials title" },
      description: { vi: "Tiêu đề section đánh giá", en: "Testimonials section title" },
      position: { topPercent: 74, leftPercent: 44 },
    },
    {
      id: "charm.testimonials.subtitle",
      type: "textarea",
      label: { vi: "Mô tả đánh giá", en: "Testimonials subtitle" },
      description: { vi: "Mô tả section đánh giá", en: "Testimonials section subtitle" },
      position: { topPercent: 77, leftPercent: 45 },
    },
    {
      id: "charm.testimonials.0.quote",
      type: "textarea",
      label: { vi: "Review 1 - Nội dung", en: "Review 1 - Quote" },
      description: { vi: "Nội dung đánh giá 1", en: "Review quote 1" },
      position: { topPercent: 82, leftPercent: 20 },
    },
    {
      id: "charm.testimonials.0.name",
      type: "text",
      label: { vi: "Review 1 - Tên", en: "Review 1 - Name" },
      description: { vi: "Tên khách hàng review 1", en: "Reviewer name 1" },
      position: { topPercent: 85, leftPercent: 20 },
    },
    {
      id: "charm.testimonials.0.role",
      type: "text",
      label: { vi: "Review 1 - Vai trò", en: "Review 1 - Role" },
      description: { vi: "Vai trò khách hàng review 1", en: "Reviewer role 1" },
      position: { topPercent: 87, leftPercent: 20 },
    },
    {
      id: "charm.testimonials.1.quote",
      type: "textarea",
      label: { vi: "Review 2 - Nội dung", en: "Review 2 - Quote" },
      description: { vi: "Nội dung đánh giá 2", en: "Review quote 2" },
      position: { topPercent: 82, leftPercent: 50 },
    },
    {
      id: "charm.testimonials.1.name",
      type: "text",
      label: { vi: "Review 2 - Tên", en: "Review 2 - Name" },
      description: { vi: "Tên khách hàng review 2", en: "Reviewer name 2" },
      position: { topPercent: 85, leftPercent: 50 },
    },
    {
      id: "charm.testimonials.1.role",
      type: "text",
      label: { vi: "Review 2 - Vai trò", en: "Review 2 - Role" },
      description: { vi: "Vai trò khách hàng review 2", en: "Reviewer role 2" },
      position: { topPercent: 87, leftPercent: 50 },
    },
    {
      id: "charm.testimonials.2.quote",
      type: "textarea",
      label: { vi: "Review 3 - Nội dung", en: "Review 3 - Quote" },
      description: { vi: "Nội dung đánh giá 3", en: "Review quote 3" },
      position: { topPercent: 82, leftPercent: 80 },
    },
    {
      id: "charm.testimonials.2.name",
      type: "text",
      label: { vi: "Review 3 - Tên", en: "Review 3 - Name" },
      description: { vi: "Tên khách hàng review 3", en: "Reviewer name 3" },
      position: { topPercent: 85, leftPercent: 80 },
    },
    {
      id: "charm.testimonials.2.role",
      type: "text",
      label: { vi: "Review 3 - Vai trò", en: "Review 3 - Role" },
      description: { vi: "Vai trò khách hàng review 3", en: "Reviewer role 3" },
      position: { topPercent: 87, leftPercent: 80 },
    },
    {
      id: "charm.social.links",
      type: "socialLinks",
      label: { vi: "Liên kết mạng xã hội", en: "Social links" },
      description: { vi: "Chỉnh các link mạng xã hội", en: "Update social network links" },
      position: { topPercent: 86, leftPercent: 22 },
    },
    {
      id: "charm.footer.brandName",
      type: "text",
      label: { vi: "Tên thương hiệu footer", en: "Footer brand name" },
      description: { vi: "Tên thương hiệu ở footer", en: "Brand name shown in footer" },
      position: { topPercent: 90, leftPercent: 20 },
    },
    {
      id: "charm.footer.summary",
      type: "textarea",
      label: { vi: "Mô tả footer", en: "Footer summary" },
      description: { vi: "Dòng mô tả dưới tên thương hiệu", en: "Summary line below brand name" },
      position: { topPercent: 93, leftPercent: 20 },
    },
    {
      id: "charm.contact.items",
      type: "contactInfo",
      label: { vi: "Thông tin liên hệ footer", en: "Footer contact info" },
      description: { vi: "Hotline, email, địa chỉ footer", en: "Footer hotline, email, address" },
      position: { topPercent: 90, leftPercent: 79 },
    },
    {
      id: "charm.footer.products",
      type: "textList",
      label: { vi: "Danh sách link sản phẩm footer", en: "Footer product links" },
      description: { vi: "Mỗi dòng là 1 link text", en: "One text-link item per line" },
      position: { topPercent: 87, leftPercent: 41 },
    },
    {
      id: "charm.footer.support",
      type: "textList",
      label: { vi: "Danh sách link hỗ trợ footer", en: "Footer support links" },
      description: { vi: "Mỗi dòng là 1 link text", en: "One text-link item per line" },
      position: { topPercent: 87, leftPercent: 60 },
    },
  ],
  "theme-3d": [
    {
      id: "3d.hero.badge",
      type: "text",
      label: { vi: "Hero badge", en: "Hero badge" },
      description: { vi: "Nhãn badge hero", en: "Hero badge label" },
      position: { topPercent: 13, leftPercent: 32 },
    },
    {
      id: "3d.hero.line1",
      type: "text",
      label: { vi: "Hero dòng 1", en: "Hero line 1" },
      description: { vi: "Headline dòng đầu", en: "First headline line" },
      position: { topPercent: 20, leftPercent: 28 },
    },
    {
      id: "3d.hero.highlight",
      type: "text",
      label: { vi: "Hero highlight", en: "Hero highlight" },
      description: { vi: "Chữ nhấn trong hero", en: "Highlighted hero text" },
      position: { topPercent: 24, leftPercent: 44 },
    },
    {
      id: "3d.hero.line3",
      type: "text",
      label: { vi: "Hero dòng 3", en: "Hero line 3" },
      description: { vi: "Dòng headline thứ ba", en: "Third headline line" },
      position: { topPercent: 28, leftPercent: 31 },
    },
    {
      id: "3d.hero.subtitle",
      type: "textarea",
      label: { vi: "Hero mô tả", en: "Hero subtitle" },
      description: { vi: "Mô tả hero", en: "Hero subtitle" },
      position: { topPercent: 33, leftPercent: 31 },
    },
    {
      id: "3d.hero.image",
      type: "image",
      label: { vi: "Ảnh hero", en: "Hero image" },
      description: { vi: "Ảnh nhân vật hero", en: "Hero visual image" },
      position: { topPercent: 21, leftPercent: 73 },
    },
    {
      id: "3d.meta.pageLogo",
      type: "image",
      label: { vi: "Logo trang", en: "Page logo" },
      description: { vi: "Logo hiển thị trên header", en: "Logo shown on header" },
      position: { topPercent: 4, leftPercent: 9 },
    },
    {
      id: "3d.collection.title",
      type: "text",
      label: { vi: "Tiêu đề bộ sưu tập", en: "Collection title" },
      description: { vi: "Tiêu đề section collection", en: "Collection section title" },
      position: { topPercent: 49, leftPercent: 30 },
    },
    {
      id: "3d.collection.highlight",
      type: "text",
      label: { vi: "Collection highlight", en: "Collection highlight" },
      description: { vi: "Chữ nhấn collection", en: "Highlighted collection text" },
      position: { topPercent: 52, leftPercent: 47 },
    },
    {
      id: "3d.featured.products",
      type: "featuredProducts",
      label: { vi: "Danh sách sản phẩm nổi bật", en: "Featured products list" },
      description: { vi: "Chọn sản phẩm hiển thị", en: "Select products to render" },
      position: { topPercent: 57, leftPercent: 83 },
    },
    {
      id: "3d.stats.0.value",
      type: "text",
      label: { vi: "Số liệu 1", en: "Stat value 1" },
      description: { vi: "Giá trị thống kê đầu tiên", en: "First stat counter value" },
      position: { topPercent: 39, leftPercent: 12 },
    },
    {
      id: "3d.stats.0.label",
      type: "text",
      label: { vi: "Nhãn số liệu 1", en: "Stat label 1" },
      description: { vi: "Nhãn thống kê đầu tiên", en: "First stat label" },
      position: { topPercent: 43, leftPercent: 12 },
    },
    {
      id: "3d.stats.1.value",
      type: "text",
      label: { vi: "Số liệu 2", en: "Stat value 2" },
      description: { vi: "Giá trị thống kê thứ hai", en: "Second stat counter value" },
      position: { topPercent: 39, leftPercent: 36 },
    },
    {
      id: "3d.stats.1.label",
      type: "text",
      label: { vi: "Nhãn số liệu 2", en: "Stat label 2" },
      description: { vi: "Nhãn thống kê thứ hai", en: "Second stat label" },
      position: { topPercent: 43, leftPercent: 36 },
    },
    {
      id: "3d.stats.2.value",
      type: "text",
      label: { vi: "Số liệu 3", en: "Stat value 3" },
      description: { vi: "Giá trị thống kê thứ ba", en: "Third stat counter value" },
      position: { topPercent: 39, leftPercent: 60 },
    },
    {
      id: "3d.stats.2.label",
      type: "text",
      label: { vi: "Nhãn số liệu 3", en: "Stat label 3" },
      description: { vi: "Nhãn thống kê thứ ba", en: "Third stat label" },
      position: { topPercent: 43, leftPercent: 60 },
    },
    {
      id: "3d.stats.3.value",
      type: "text",
      label: { vi: "Số liệu 4", en: "Stat value 4" },
      description: { vi: "Giá trị thống kê thứ tư", en: "Fourth stat counter value" },
      position: { topPercent: 39, leftPercent: 84 },
    },
    {
      id: "3d.stats.3.label",
      type: "text",
      label: { vi: "Nhãn số liệu 4", en: "Stat label 4" },
      description: { vi: "Nhãn thống kê thứ tư", en: "Fourth stat label" },
      position: { topPercent: 43, leftPercent: 84 },
    },
    {
      id: "3d.services.whyChoosePrefix",
      type: "text",
      label: { vi: "Tiêu đề vì sao chọn", en: "Why-choose title" },
      description: { vi: "Text 'Tại sao chọn chúng tôi'", en: "Why-choose section heading" },
      position: { topPercent: 67, leftPercent: 40 },
    },
    {
      id: "3d.reviews.titleLine1",
      type: "text",
      label: { vi: "Tiêu đề khách hàng dòng 1", en: "Reviews title line 1" },
      description: { vi: "Dòng 1 của tiêu đề reviews", en: "First reviews heading line" },
      position: { topPercent: 78, leftPercent: 40 },
    },
    {
      id: "3d.reviews.titleLine2",
      type: "text",
      label: { vi: "Tiêu đề khách hàng dòng 2", en: "Reviews title line 2" },
      description: { vi: "Dòng nhấn của tiêu đề reviews", en: "Highlighted reviews heading line" },
      position: { topPercent: 78, leftPercent: 58 },
    },
    {
      id: "3d.reviews.label",
      type: "text",
      label: { vi: "Nhãn đánh giá", en: "Reviews label" },
      description: { vi: "Nhãn nhỏ của section đánh giá", en: "Small label above reviews title" },
      position: { topPercent: 76, leftPercent: 48 },
    },
    {
      id: "3d.reviews.0.text",
      type: "textarea",
      label: { vi: "Review 1 - Nội dung", en: "Review 1 - Text" },
      description: { vi: "Nội dung đánh giá 1", en: "Review text 1" },
      position: { topPercent: 81, leftPercent: 19 },
    },
    {
      id: "3d.reviews.0.name",
      type: "text",
      label: { vi: "Review 1 - Tên", en: "Review 1 - Name" },
      description: { vi: "Tên khách hàng review 1", en: "Reviewer name 1" },
      position: { topPercent: 84, leftPercent: 19 },
    },
    {
      id: "3d.reviews.0.role",
      type: "text",
      label: { vi: "Review 1 - Vai trò", en: "Review 1 - Role" },
      description: { vi: "Vai trò khách hàng review 1", en: "Reviewer role 1" },
      position: { topPercent: 86, leftPercent: 19 },
    },
    {
      id: "3d.reviews.1.text",
      type: "textarea",
      label: { vi: "Review 2 - Nội dung", en: "Review 2 - Text" },
      description: { vi: "Nội dung đánh giá 2", en: "Review text 2" },
      position: { topPercent: 81, leftPercent: 49 },
    },
    {
      id: "3d.reviews.1.name",
      type: "text",
      label: { vi: "Review 2 - Tên", en: "Review 2 - Name" },
      description: { vi: "Tên khách hàng review 2", en: "Reviewer name 2" },
      position: { topPercent: 84, leftPercent: 49 },
    },
    {
      id: "3d.reviews.1.role",
      type: "text",
      label: { vi: "Review 2 - Vai trò", en: "Review 2 - Role" },
      description: { vi: "Vai trò khách hàng review 2", en: "Reviewer role 2" },
      position: { topPercent: 86, leftPercent: 49 },
    },
    {
      id: "3d.reviews.2.text",
      type: "textarea",
      label: { vi: "Review 3 - Nội dung", en: "Review 3 - Text" },
      description: { vi: "Nội dung đánh giá 3", en: "Review text 3" },
      position: { topPercent: 81, leftPercent: 79 },
    },
    {
      id: "3d.reviews.2.name",
      type: "text",
      label: { vi: "Review 3 - Tên", en: "Review 3 - Name" },
      description: { vi: "Tên khách hàng review 3", en: "Reviewer name 3" },
      position: { topPercent: 84, leftPercent: 79 },
    },
    {
      id: "3d.reviews.2.role",
      type: "text",
      label: { vi: "Review 3 - Vai trò", en: "Review 3 - Role" },
      description: { vi: "Vai trò khách hàng review 3", en: "Reviewer role 3" },
      position: { topPercent: 86, leftPercent: 79 },
    },
    {
      id: "3d.cta.titleLine1",
      type: "text",
      label: { vi: "Tiêu đề CTA dòng 1", en: "CTA title line 1" },
      description: { vi: "Text 'Sẵn sàng tỏa sáng...'", en: "CTA heading first line" },
      position: { topPercent: 87, leftPercent: 48 },
    },
    {
      id: "3d.cta.titleHighlight",
      type: "text",
      label: { vi: "Tiêu đề CTA highlight", en: "CTA title highlight" },
      description: { vi: "Dòng nhấn tiêu đề CTA", en: "CTA highlighted heading line" },
      position: { topPercent: 89, leftPercent: 53 },
    },
    {
      id: "3d.social.links",
      type: "socialLinks",
      label: { vi: "Liên kết mạng xã hội", en: "Social links" },
      description: { vi: "Chỉnh các link mạng xã hội", en: "Update social network links" },
      position: { topPercent: 87, leftPercent: 18 },
    },
    {
      id: "3d.footer.brandName",
      type: "text",
      label: { vi: "Tên thương hiệu footer", en: "Footer brand name" },
      description: { vi: "Tên thương hiệu ở footer", en: "Brand name shown in footer" },
      position: { topPercent: 90, leftPercent: 19 },
    },
    {
      id: "3d.footer.summary",
      type: "textarea",
      label: { vi: "Mô tả footer", en: "Footer summary" },
      description: { vi: "Dòng mô tả dưới tên thương hiệu", en: "Summary line below brand name" },
      position: { topPercent: 92, leftPercent: 20 },
    },
    {
      id: "3d.contact.items",
      type: "contactInfo",
      label: { vi: "Thông tin liên hệ footer", en: "Footer contact info" },
      description: { vi: "Hotline, email, địa chỉ footer", en: "Footer hotline, email, address" },
      position: { topPercent: 90, leftPercent: 79 },
    },
    {
      id: "3d.footer.categories",
      type: "textList",
      label: { vi: "Danh sách link danh mục footer", en: "Footer categories links" },
      description: { vi: "Mỗi dòng là 1 link text", en: "One text-link item per line" },
      position: { topPercent: 95, leftPercent: 40 },
    },
    {
      id: "3d.footer.supportItems",
      type: "textList",
      label: { vi: "Danh sách link hỗ trợ footer", en: "Footer support links" },
      description: { vi: "Mỗi dòng là 1 link text", en: "One text-link item per line" },
      position: { topPercent: 95, leftPercent: 58 },
    },
  ],
  "theme-modern": [
    {
      id: "modern.hero.badge",
      type: "text",
      label: { vi: "Hero badge", en: "Hero badge" },
      description: { vi: "Nhãn badge hero", en: "Hero badge label" },
      position: { topPercent: 13, leftPercent: 50 },
    },
    {
      id: "modern.hero.line1",
      type: "text",
      label: { vi: "Hero dòng 1", en: "Hero line 1" },
      description: { vi: "Dòng headline đầu", en: "First headline line" },
      position: { topPercent: 19, leftPercent: 42 },
    },
    {
      id: "modern.hero.line2",
      type: "text",
      label: { vi: "Hero dòng 2", en: "Hero line 2" },
      description: { vi: "Dòng headline thứ hai", en: "Second headline line" },
      position: { topPercent: 23, leftPercent: 58 },
    },
    {
      id: "modern.hero.subtitle",
      type: "textarea",
      label: { vi: "Hero mô tả", en: "Hero subtitle" },
      description: { vi: "Mô tả hero", en: "Hero subtitle" },
      position: { topPercent: 29, leftPercent: 51 },
    },
    {
      id: "modern.hero.image",
      type: "image",
      label: { vi: "Ảnh hero", en: "Hero image" },
      description: { vi: "Ảnh nền hero", en: "Hero background image" },
      position: { topPercent: 8, leftPercent: 9 },
    },
    {
      id: "modern.meta.pageLogo",
      type: "image",
      label: { vi: "Logo trang", en: "Page logo" },
      description: { vi: "Logo hiển thị trên header", en: "Logo shown on header" },
      position: { topPercent: 4, leftPercent: 8 },
    },
    {
      id: "modern.products.label",
      type: "text",
      label: { vi: "Nhãn sản phẩm", en: "Products label" },
      description: { vi: "Nhãn section sản phẩm", en: "Products section label" },
      position: { topPercent: 49, leftPercent: 20 },
    },
    {
      id: "modern.products.title",
      type: "text",
      label: { vi: "Tiêu đề sản phẩm", en: "Products title" },
      description: { vi: "Tiêu đề section sản phẩm", en: "Products section title" },
      position: { topPercent: 52, leftPercent: 31 },
    },
    {
      id: "modern.featured.products",
      type: "featuredProducts",
      label: { vi: "Danh sách sản phẩm nổi bật", en: "Featured products list" },
      description: { vi: "Chọn sản phẩm hiển thị", en: "Select products to render" },
      position: { topPercent: 58, leftPercent: 80 },
    },
    {
      id: "modern.testimonials.label",
      type: "text",
      label: { vi: "Nhãn đánh giá", en: "Testimonials label" },
      description: { vi: "Nhãn section đánh giá", en: "Testimonials section label" },
      position: { topPercent: 70, leftPercent: 48 },
    },
    {
      id: "modern.testimonials.title",
      type: "text",
      label: { vi: "Tiêu đề đánh giá", en: "Testimonials title" },
      description: { vi: "Tiêu đề section đánh giá", en: "Testimonials section title" },
      position: { topPercent: 73, leftPercent: 48 },
    },
    {
      id: "modern.testimonials.0.text",
      type: "textarea",
      label: { vi: "Review 1 - Nội dung", en: "Review 1 - Text" },
      description: { vi: "Nội dung đánh giá 1", en: "Review text 1" },
      position: { topPercent: 78, leftPercent: 19 },
    },
    {
      id: "modern.testimonials.0.name",
      type: "text",
      label: { vi: "Review 1 - Tên", en: "Review 1 - Name" },
      description: { vi: "Tên khách hàng review 1", en: "Reviewer name 1" },
      position: { topPercent: 82, leftPercent: 19 },
    },
    {
      id: "modern.testimonials.1.text",
      type: "textarea",
      label: { vi: "Review 2 - Nội dung", en: "Review 2 - Text" },
      description: { vi: "Nội dung đánh giá 2", en: "Review text 2" },
      position: { topPercent: 78, leftPercent: 49 },
    },
    {
      id: "modern.testimonials.1.name",
      type: "text",
      label: { vi: "Review 2 - Tên", en: "Review 2 - Name" },
      description: { vi: "Tên khách hàng review 2", en: "Reviewer name 2" },
      position: { topPercent: 82, leftPercent: 49 },
    },
    {
      id: "modern.testimonials.2.text",
      type: "textarea",
      label: { vi: "Review 3 - Nội dung", en: "Review 3 - Text" },
      description: { vi: "Nội dung đánh giá 3", en: "Review text 3" },
      position: { topPercent: 78, leftPercent: 79 },
    },
    {
      id: "modern.testimonials.2.name",
      type: "text",
      label: { vi: "Review 3 - Tên", en: "Review 3 - Name" },
      description: { vi: "Tên khách hàng review 3", en: "Reviewer name 3" },
      position: { topPercent: 82, leftPercent: 79 },
    },
    {
      id: "modern.social.links",
      type: "socialLinks",
      label: { vi: "Liên kết mạng xã hội", en: "Social links" },
      description: { vi: "Chỉnh các link mạng xã hội", en: "Update social network links" },
      position: { topPercent: 86, leftPercent: 19 },
    },
    {
      id: "modern.footer.brandName",
      type: "text",
      label: { vi: "Tên thương hiệu footer", en: "Footer brand name" },
      description: { vi: "Tên thương hiệu ở footer", en: "Brand name shown in footer" },
      position: { topPercent: 88, leftPercent: 19 },
    },
    {
      id: "modern.footer.summary",
      type: "textarea",
      label: { vi: "Mô tả footer", en: "Footer summary" },
      description: { vi: "Dòng mô tả dưới tên thương hiệu", en: "Summary line below brand name" },
      position: { topPercent: 91, leftPercent: 19 },
    },
    {
      id: "modern.contact.items",
      type: "contactInfo",
      label: { vi: "Thông tin liên hệ footer", en: "Footer contact info" },
      description: { vi: "Hotline, email, địa chỉ footer", en: "Footer hotline, email, address" },
      position: { topPercent: 78, leftPercent: 26 },
    },
    {
      id: "modern.footer.links",
      type: "textList",
      label: { vi: "Danh sách link footer", en: "Footer links list" },
      description: { vi: "Mỗi dòng là 1 link text", en: "One text-link item per line" },
      position: { topPercent: 86, leftPercent: 47 },
    },
    {
      id: "modern.footer.supportItems",
      type: "textList",
      label: { vi: "Danh sách hỗ trợ footer", en: "Footer support list" },
      description: { vi: "Mỗi dòng là 1 link text", en: "One text-link item per line" },
      position: { topPercent: 86, leftPercent: 66 },
    },
  ],
  "legacy-default": [
    {
      id: "default.meta.pageLogo",
      type: "image",
      label: { vi: "Logo trang", en: "Page logo" },
      description: { vi: "Logo hiển thị trên hero", en: "Logo displayed in hero" },
      position: { topPercent: 9, leftPercent: 46 },
    },
    {
      id: "default.meta.pageName",
      type: "text",
      label: { vi: "Tên trang", en: "Page name" },
      description: { vi: "Tên thương hiệu hiển thị trên hero", en: "Brand/page name on hero" },
      position: { topPercent: 17, leftPercent: 50 },
    },
    {
      id: "default.hero.badge",
      type: "text",
      label: { vi: "Hero badge", en: "Hero badge" },
      description: { vi: "Nhãn ngắn ở hero", en: "Short hero badge text" },
      position: { topPercent: 20, leftPercent: 50 },
    },
    {
      id: "default.hero.heading",
      type: "textarea",
      label: { vi: "Hero heading", en: "Hero heading" },
      description: { vi: "Tiêu đề chính của hero", en: "Main hero heading" },
      position: { topPercent: 26, leftPercent: 50 },
    },
    {
      id: "default.hero.subheading",
      type: "textarea",
      label: { vi: "Hero subheading", en: "Hero subheading" },
      description: { vi: "Mô tả dưới tiêu đề", en: "Description under heading" },
      position: { topPercent: 32, leftPercent: 50 },
    },
    {
      id: "default.hero.searchPlaceholder",
      type: "text",
      label: { vi: "Placeholder tìm kiếm", en: "Search placeholder" },
      description: { vi: "Placeholder của search box", en: "Search box placeholder" },
      position: { topPercent: 39, leftPercent: 49 },
    },
    {
      id: "default.featured.title",
      type: "text",
      label: { vi: "Tiêu đề sản phẩm nổi bật", en: "Featured title" },
      description: { vi: "Tiêu đề section featured", en: "Featured section title" },
      position: { topPercent: 55, leftPercent: 20 },
    },
    {
      id: "default.featured.showMoreLabel",
      type: "text",
      label: { vi: "Nhãn xem thêm", en: "Show-more label" },
      description: { vi: "Nhãn nút xem thêm", en: "Show-more button label" },
      position: { topPercent: 56, leftPercent: 83 },
    },
    {
      id: "default.featured.products",
      type: "featuredProducts",
      label: { vi: "Danh sách sản phẩm nổi bật", en: "Featured products list" },
      description: { vi: "Chọn sản phẩm hiển thị", en: "Select products to render" },
      position: { topPercent: 63, leftPercent: 84 },
    },
    {
      id: "default.testimonials.0.text",
      type: "textarea",
      label: { vi: "Review 1 - Nội dung", en: "Review 1 - Text" },
      description: { vi: "Nội dung đánh giá 1", en: "Review text 1" },
      position: { topPercent: 88, leftPercent: 20 },
    },
    {
      id: "default.testimonials.0.name",
      type: "text",
      label: { vi: "Review 1 - Tên", en: "Review 1 - Name" },
      description: { vi: "Tên khách hàng review 1", en: "Reviewer name 1" },
      position: { topPercent: 91, leftPercent: 20 },
    },
    {
      id: "default.testimonials.1.text",
      type: "textarea",
      label: { vi: "Review 2 - Nội dung", en: "Review 2 - Text" },
      description: { vi: "Nội dung đánh giá 2", en: "Review text 2" },
      position: { topPercent: 88, leftPercent: 50 },
    },
    {
      id: "default.testimonials.1.name",
      type: "text",
      label: { vi: "Review 2 - Tên", en: "Review 2 - Name" },
      description: { vi: "Tên khách hàng review 2", en: "Reviewer name 2" },
      position: { topPercent: 91, leftPercent: 50 },
    },
    {
      id: "default.testimonials.2.text",
      type: "textarea",
      label: { vi: "Review 3 - Nội dung", en: "Review 3 - Text" },
      description: { vi: "Nội dung đánh giá 3", en: "Review text 3" },
      position: { topPercent: 88, leftPercent: 80 },
    },
    {
      id: "default.testimonials.2.name",
      type: "text",
      label: { vi: "Review 3 - Tên", en: "Review 3 - Name" },
      description: { vi: "Tên khách hàng review 3", en: "Reviewer name 3" },
      position: { topPercent: 91, leftPercent: 80 },
    },
    {
      id: "default.social.links",
      type: "socialLinks",
      label: { vi: "Liên kết mạng xã hội", en: "Social links" },
      description: { vi: "Chỉnh các link mạng xã hội", en: "Update social network links" },
      position: { topPercent: 89, leftPercent: 50 },
    },
    {
      id: "default.contact.hotline",
      type: "text",
      label: { vi: "Hotline liên hệ", en: "Contact hotline" },
      description: { vi: "Số hotline công khai", en: "Public contact hotline" },
      position: { topPercent: 86, leftPercent: 43 },
    },
    {
      id: "default.contact.address",
      type: "text",
      label: { vi: "Địa chỉ cửa hàng", en: "Store address" },
      description: { vi: "Địa chỉ công khai ở footer", en: "Public store address in footer" },
      position: { topPercent: 86, leftPercent: 59 },
    },
    {
      id: "default.contact.email",
      type: "text",
      label: { vi: "Email liên hệ", en: "Contact email" },
      description: { vi: "Email công khai liên hệ", en: "Public contact email" },
      position: { topPercent: 86, leftPercent: 51 },
    },
  ],
};

function resolveLocaleText(value: { vi: string; en: string }, locale: SettingLocale): string {
  const primary = value[locale] ?? "";
  if (primary.length > 0) return primary;
  const fallback = value[locale === "vi" ? "en" : "vi"] ?? "";
  return fallback;
}

function withLocaleText<T extends ProductLanding3DLocalizedText | ProductLandingCharmLocalizedText | ProductLandingModernLocalizedText>(
  source: T,
  locale: SettingLocale,
  nextValue: string
): T {
  return {
    ...source,
    [locale]: nextValue,
  };
}

function normalizeOptionalImageValue(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function joinEditableList(items: string[]): string {
  return items.join("\n");
}

function parseEditableList(value: string): string[] {
  return value
    .split("\n")
    .map((entry) => entry.trim())
    .filter((entry, index, source) => entry.length > 0 && source.indexOf(entry) === index);
}

function parseContactInfoEditableValue(value: string): {
  hotline: string;
  email: string;
  storeAddress: string;
} {
  const [hotline = "", email = "", storeAddress = ""] = value
    .split("\n")
    .map((entry) => entry.trim());
  return {
    hotline,
    email,
    storeAddress,
  };
}

function parse3dStatsNodeId(nodeId: string): { index: number; field: "value" | "label" } | null {
  const match = /^3d\.stats\.(\d+)\.(value|label)$/.exec(nodeId);
  if (!match) return null;
  const index = Number.parseInt(match[1], 10);
  if (!Number.isFinite(index) || index < 0) return null;
  const field = match[2] as "value" | "label";
  return { index, field };
}

function parse3dReviewNodeId(nodeId: string): { index: number; field: "text" | "name" | "role" } | null {
  const match = /^3d\.reviews\.(\d+)\.(text|name|role)$/.exec(nodeId);
  if (!match) return null;
  const index = Number.parseInt(match[1], 10);
  if (!Number.isFinite(index) || index < 0) return null;
  return { index, field: match[2] as "text" | "name" | "role" };
}

function parseCharmTestimonialNodeId(
  nodeId: string
): { index: number; field: "quote" | "name" | "role" } | null {
  const match = /^charm\.testimonials\.(\d+)\.(quote|name|role)$/.exec(nodeId);
  if (!match) return null;
  const index = Number.parseInt(match[1], 10);
  if (!Number.isFinite(index) || index < 0) return null;
  return { index, field: match[2] as "quote" | "name" | "role" };
}

function parseCharmFeatureNodeId(
  nodeId: string
): { index: number; field: "title" | "description" } | null {
  const match = /^charm\.features\.(\d+)\.(title|description)$/.exec(nodeId);
  if (!match) return null;
  const index = Number.parseInt(match[1], 10);
  if (!Number.isFinite(index) || index < 0) return null;
  return { index, field: match[2] as "title" | "description" };
}

function parseModernTestimonialNodeId(
  nodeId: string
): { index: number; field: "text" | "name" } | null {
  const match = /^modern\.testimonials\.(\d+)\.(text|name)$/.exec(nodeId);
  if (!match) return null;
  const index = Number.parseInt(match[1], 10);
  if (!Number.isFinite(index) || index < 0) return null;
  return { index, field: match[2] as "text" | "name" };
}

function parseDefaultTestimonialNodeId(
  nodeId: string
): { index: number; field: "text" | "name" } | null {
  const match = /^default\.testimonials\.(\d+)\.(text|name)$/.exec(nodeId);
  if (!match) return null;
  const index = Number.parseInt(match[1], 10);
  if (!Number.isFinite(index) || index < 0) return null;
  return { index, field: match[2] as "text" | "name" };
}

function parseStatCounterInput(input: string, fallbackValue: number, fallbackSuffix: string) {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      value: fallbackValue,
      suffix: fallbackSuffix,
    };
  }

  const firstDigitIndex = trimmed.search(/\d/);
  if (firstDigitIndex < 0) {
    return {
      value: fallbackValue,
      suffix: trimmed,
    };
  }

  const firstNonDigitAfterStart = trimmed.slice(firstDigitIndex).search(/[^\d.,]/);
  const splitIndex =
    firstNonDigitAfterStart < 0
      ? trimmed.length
      : firstDigitIndex + firstNonDigitAfterStart;
  const numberPart = trimmed
    .slice(firstDigitIndex, splitIndex)
    .replace(/[.,](?=\d{3}\b)/g, "")
    .replace(/,/g, "");
  const parsedValue = Number.parseInt(numberPart, 10);
  const nextValue = Number.isFinite(parsedValue) ? parsedValue : fallbackValue;
  const parsedSuffix = trimmed.slice(splitIndex).trim();
  const nextSuffix = Number.isFinite(parsedValue) ? parsedSuffix : fallbackSuffix;

  return {
    value: nextValue,
    suffix: nextSuffix,
  };
}

function compactSingleLine(value: string, maxLength = 72): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3)}...`;
}

function formatHeroFeaturedPrice(value: number | null, locale: SettingLocale): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return locale === "vi" ? "Liên hệ" : "Contact us";
  }

  const rounded = Math.round(value);
  if (locale === "vi") {
    return `${new Intl.NumberFormat("vi-VN").format(rounded)}đ / ngày`;
  }

  return `${new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(rounded)} / day`;
}

function toPreviewProduct(
  entry: SettingsShowroomFeaturedProductOptionDto,
  index: number
): ProductLandingTemplateModel["featuredProducts"][number] {
  const fallbackRentPricePerDay = 380_000 + index * 40_000;
  const rentPricePerDay =
    typeof entry.rentPricePerDay === "number" && Number.isFinite(entry.rentPricePerDay)
      ? Math.max(0, Math.round(entry.rentPricePerDay))
      : fallbackRentPricePerDay;

  return {
    id: entry.id,
    title: entry.name,
    coverImageUrl: showroomClientService.resolveCoverImageUrl(entry.coverImagePath),
    coverImagePath: entry.coverImagePath,
    categoryName: entry.categoryName,
    tags: [
      entry.categoryName?.trim() || entry.productCode.trim() || "Featured",
    ],
    gender: null,
    material: null,
    sizes: [],
    colors: [],
    rentPricePerDay,
    quickRentPrice:
      typeof entry.quickRentPrice === "number" && Number.isFinite(entry.quickRentPrice)
        ? Math.max(0, Math.round(entry.quickRentPrice))
        : null,
    salePrice: null,
    isRentable: true,
    isSaleable: false,
    successfulRentCount: 0,
    pricePlan: {
      defaultDepositAmount: null,
      price1d: null,
      price3d: null,
      price7d: null,
      pricePerDay: null,
    },
    priceLabel: null,
    depositLabel: null,
  };
}

export function useSettingsShowroomVisualEditor({
  locale,
  pageLocale,
  templateCode,
  branchLabel,
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
}: UseSettingsShowroomVisualEditorParams) {
  const [editorMode, setEditorMode] = useState<VisualEditorMode>("visual");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [featuredSearch, setFeaturedSearch] = useState("");

  const activeTemplateKind: VisualEditorTemplateKind = useMemo(() => {
    if (isThemeCharmSelected || isProductLandingCharmTemplateCode(templateCode)) {
      return "theme-charm";
    }
    if (isTheme3DSelected || isProductLanding3DTemplateCode(templateCode)) {
      return "theme-3d";
    }
    if (isThemeModernSelected || isProductLandingModernTemplateCode(templateCode)) {
      return "theme-modern";
    }
    return "legacy-default";
  }, [isTheme3DSelected, isThemeCharmSelected, isThemeModernSelected, templateCode]);

  const canUseVisualEditor = true;
  const visualNodes = useMemo(
    () => (activeTemplateKind ? VISUAL_EDITOR_NODES[activeTemplateKind] : []),
    [activeTemplateKind]
  );
  const normalizedSelectedNodeId = useMemo(() => {
    if (!selectedNodeId) return null;
    return visualNodes.some((entry) => entry.id === selectedNodeId) ? selectedNodeId : null;
  }, [selectedNodeId, visualNodes]);
  const effectiveEditorMode: VisualEditorMode = canUseVisualEditor ? editorMode : "legacy";
  const effectiveDrawerOpen = canUseVisualEditor ? drawerOpen : false;

  const selectedNode = useMemo(
    () => visualNodes.find((entry) => entry.id === normalizedSelectedNodeId) ?? null,
    [normalizedSelectedNodeId, visualNodes]
  );
  const visualNodeTypeMap = useMemo(() => {
    const map = new Map<string, VisualEditorNodeType>();
    for (const entry of visualNodes) {
      map.set(entry.id, entry.type);
    }
    return map;
  }, [visualNodes]);

  const featuredProductMap = useMemo(() => {
    const map = new Map<string, SettingsShowroomFeaturedProductOptionDto>();
    for (const entry of featuredProductOptions) {
      map.set(entry.id, entry);
    }
    return map;
  }, [featuredProductOptions]);
  const featuredProductByCodeMap = useMemo(() => {
    const map = new Map<string, SettingsShowroomFeaturedProductOptionDto>();
    for (const entry of featuredProductOptions) {
      const normalizedCode = entry.productCode.trim().toLowerCase();
      if (!normalizedCode || map.has(normalizedCode)) continue;
      map.set(normalizedCode, entry);
    }
    return map;
  }, [featuredProductOptions]);

  const selectedFeaturedProductIds = useMemo(() => {
    const source =
      activeTemplateKind === "theme-charm"
        ? themeCharmDraft.featuredProductIds
        : activeTemplateKind === "theme-3d"
          ? theme3dDraft.featuredProductIds
          : activeTemplateKind === "theme-modern"
            ? themeModernDraft.featuredProductIds
            : featuredProductIds;

    const resolvedIdSet = new Set<string>();
    const unresolvedTokens: string[] = [];
    const seenUnresolved = new Set<string>();
    for (const entry of source) {
      if (typeof entry !== "string") continue;
      const trimmed = entry.trim();
      if (!trimmed) continue;

      const resolvedId = featuredProductMap.has(trimmed)
        ? trimmed
        : featuredProductByCodeMap.get(trimmed.toLowerCase())?.id ?? trimmed;
      if (featuredProductMap.has(resolvedId)) {
        resolvedIdSet.add(resolvedId);
        continue;
      }

      const unresolvedKey = resolvedId.toLowerCase();
      if (seenUnresolved.has(unresolvedKey)) continue;
      seenUnresolved.add(unresolvedKey);
      unresolvedTokens.push(resolvedId);
    }

    const orderedResolved = featuredProductOptions
      .map((entry) => entry.id)
      .filter((id) => resolvedIdSet.has(id));

    return [...orderedResolved, ...unresolvedTokens];
  }, [
    activeTemplateKind,
    featuredProductByCodeMap,
    featuredProductMap,
    featuredProductIds,
    featuredProductOptions,
    theme3dDraft.featuredProductIds,
    themeCharmDraft.featuredProductIds,
    themeModernDraft.featuredProductIds,
  ]);

  const filteredFeaturedProductOptions = useMemo(() => {
    const keyword = featuredSearch.trim().toLowerCase();
    if (!keyword) return featuredProductOptions;
    return featuredProductOptions.filter((entry) => {
      const haystack = `${entry.productCode} ${entry.name} ${entry.categoryName ?? ""}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [featuredProductOptions, featuredSearch]);

  const selected3dHeroProductId = useMemo(() => {
    const heroImagePath = normalizeOptionalImageValue(theme3dDraft.hero.heroImagePath ?? "");
    const heroFeaturedName = theme3dDraft.hero.featuredName[pageLocale].trim().toLowerCase();

    if (heroImagePath) {
      const byImage = featuredProductOptions.find((entry) => {
        const rawPath = normalizeOptionalImageValue(entry.coverImagePath ?? "");
        const publicUrl = normalizeOptionalImageValue(
          showroomClientService.resolveCoverImageUrl(entry.coverImagePath) ?? ""
        );
        return rawPath === heroImagePath || publicUrl === heroImagePath;
      });
      if (byImage) return byImage.id;
    }

    if (!heroFeaturedName) return null;
    const byName = featuredProductOptions.find(
      (entry) => entry.name.trim().toLowerCase() === heroFeaturedName
    );
    return byName?.id ?? null;
  }, [
    featuredProductOptions,
    pageLocale,
    theme3dDraft.hero.featuredName,
    theme3dDraft.hero.heroImagePath,
  ]);

  const getNodeValue = useCallback(
    (nodeId: string): string => {
      if (activeTemplateKind === "theme-charm") {
        const featureNode = parseCharmFeatureNodeId(nodeId);
        if (featureNode) {
          const feature = themeCharmDraft.featureItems[featureNode.index];
          if (!feature) return "";
          if (featureNode.field === "title") {
            return resolveLocaleText(feature.title, pageLocale);
          }
          return resolveLocaleText(feature.description, pageLocale);
        }

        const testimonialNode = parseCharmTestimonialNodeId(nodeId);
        if (testimonialNode) {
          const testimonial = themeCharmDraft.testimonialItems[testimonialNode.index];
          if (!testimonial) return "";
          switch (testimonialNode.field) {
            case "quote":
              return resolveLocaleText(testimonial.quote, pageLocale);
            case "name":
              return resolveLocaleText(testimonial.name, pageLocale);
            case "role":
              return resolveLocaleText(testimonial.role, pageLocale);
            default:
              return "";
          }
        }

        switch (nodeId) {
          case "charm.hero.badge":
            return resolveLocaleText(themeCharmDraft.hero.badge, pageLocale);
          case "charm.hero.line1":
            return resolveLocaleText(themeCharmDraft.hero.line1, pageLocale);
          case "charm.hero.line2":
            return resolveLocaleText(themeCharmDraft.hero.line2, pageLocale);
          case "charm.hero.subtitle":
            return resolveLocaleText(themeCharmDraft.hero.subtitle, pageLocale);
          case "charm.hero.image":
            return themeCharmDraft.hero.heroImagePath ?? "";
          case "charm.meta.pageLogo":
            return themeCharmDraft.meta.pageLogoUrl ?? "";
          case "charm.featured.title":
            return resolveLocaleText(themeCharmDraft.featured.title, pageLocale);
          case "charm.featured.subtitle":
            return resolveLocaleText(themeCharmDraft.featured.subtitle, pageLocale);
          case "charm.features.title":
            return resolveLocaleText(themeCharmDraft.features.title, pageLocale);
          case "charm.features.subtitle":
            return resolveLocaleText(themeCharmDraft.features.subtitle, pageLocale);
          case "charm.testimonials.title":
            return resolveLocaleText(themeCharmDraft.testimonials.title, pageLocale);
          case "charm.testimonials.subtitle":
            return resolveLocaleText(themeCharmDraft.testimonials.subtitle, pageLocale);
          case "charm.footer.brandName":
            return resolveLocaleText(themeCharmDraft.meta.pageName, pageLocale);
          case "charm.footer.summary":
            return resolveLocaleText(themeCharmDraft.footer.summary, pageLocale);
          case "charm.footer.products":
            return joinEditableList(themeCharmDraft.footer.products[pageLocale]);
          case "charm.footer.support":
            return joinEditableList(themeCharmDraft.footer.support[pageLocale]);
          case "charm.contact.items":
            return [
              contactInfoDraft.hotline,
              contactInfoDraft.email,
              contactInfoDraft.storeAddress,
            ]
              .map((entry) => entry.trim())
              .filter((entry) => entry.length > 0)
              .join("\n");
          default:
            return "";
        }
      }

      if (activeTemplateKind === "theme-3d") {
        const statsNode = parse3dStatsNodeId(nodeId);
        if (statsNode) {
          const statsEntry = theme3dDraft.stats[statsNode.index];
          if (!statsEntry) return "";
          if (statsNode.field === "label") {
            return resolveLocaleText(statsEntry.label, pageLocale);
          }
          return `${statsEntry.value}${statsEntry.suffix}`;
        }
        const reviewNode = parse3dReviewNodeId(nodeId);
        if (reviewNode) {
          const reviewEntry = theme3dDraft.testimonials[reviewNode.index];
          if (!reviewEntry) return "";
          switch (reviewNode.field) {
            case "text":
              return resolveLocaleText(reviewEntry.text, pageLocale);
            case "name":
              return resolveLocaleText(reviewEntry.name, pageLocale);
            case "role":
              return resolveLocaleText(reviewEntry.role, pageLocale);
            default:
              return "";
          }
        }

        switch (nodeId) {
          case "3d.hero.badge":
            return resolveLocaleText(theme3dDraft.hero.badge, pageLocale);
          case "3d.hero.line1":
            return resolveLocaleText(theme3dDraft.hero.line1, pageLocale);
          case "3d.hero.highlight":
            return resolveLocaleText(theme3dDraft.hero.highlight, pageLocale);
          case "3d.hero.line3":
            return resolveLocaleText(theme3dDraft.hero.line3, pageLocale);
          case "3d.hero.subtitle":
            return resolveLocaleText(theme3dDraft.hero.subtitle, pageLocale);
          case "3d.hero.image":
            return theme3dDraft.hero.heroImagePath ?? "";
          case "3d.meta.pageLogo":
            return theme3dDraft.meta.pageLogoUrl ?? "";
          case "3d.collection.title":
            return resolveLocaleText(theme3dDraft.collection.title, pageLocale);
          case "3d.collection.highlight":
            return resolveLocaleText(theme3dDraft.collection.highlight, pageLocale);
          case "3d.services.whyChoosePrefix":
            return resolveLocaleText(theme3dDraft.services.whyChoosePrefix, pageLocale);
          case "3d.reviews.titleLine1":
            return resolveLocaleText(theme3dDraft.reviews.titleLine1, pageLocale);
          case "3d.reviews.titleLine2":
            return resolveLocaleText(theme3dDraft.reviews.titleLine2, pageLocale);
          case "3d.reviews.label":
            return resolveLocaleText(theme3dDraft.reviews.label, pageLocale);
          case "3d.cta.titleLine1":
            return resolveLocaleText(theme3dDraft.cta.titleLine1, pageLocale);
          case "3d.cta.titleHighlight":
            return resolveLocaleText(theme3dDraft.cta.titleHighlight, pageLocale);
          case "3d.footer.brandName":
            return resolveLocaleText(theme3dDraft.meta.pageName, pageLocale);
          case "3d.footer.summary":
            return resolveLocaleText(theme3dDraft.footer.summary, pageLocale);
          case "3d.footer.categories":
            return joinEditableList(theme3dDraft.footer.categories[pageLocale]);
          case "3d.footer.supportItems":
            return joinEditableList(theme3dDraft.footer.supportItems[pageLocale]);
          case "3d.contact.items":
            return [
              contactInfoDraft.hotline,
              contactInfoDraft.email,
              contactInfoDraft.storeAddress,
            ]
              .map((entry) => entry.trim())
              .filter((entry) => entry.length > 0)
              .join("\n");
          default:
            return "";
        }
      }

      if (activeTemplateKind === "theme-modern") {
        const testimonialNode = parseModernTestimonialNodeId(nodeId);
        if (testimonialNode) {
          const testimonial = themeModernDraft.testimonialItems[testimonialNode.index];
          if (!testimonial) return "";
          if (testimonialNode.field === "text") {
            return resolveLocaleText(testimonial.text, pageLocale);
          }
          return resolveLocaleText(testimonial.name, pageLocale);
        }

        switch (nodeId) {
          case "modern.hero.badge":
            return resolveLocaleText(themeModernDraft.hero.badge, pageLocale);
          case "modern.hero.line1":
            return resolveLocaleText(themeModernDraft.hero.line1, pageLocale);
          case "modern.hero.line2":
            return resolveLocaleText(themeModernDraft.hero.line2, pageLocale);
          case "modern.hero.subtitle":
            return resolveLocaleText(themeModernDraft.hero.subtitle, pageLocale);
          case "modern.hero.image":
            return themeModernDraft.hero.heroImagePath ?? "";
          case "modern.meta.pageLogo":
            return themeModernDraft.meta.pageLogoUrl ?? "";
          case "modern.products.label":
            return resolveLocaleText(themeModernDraft.products.label, pageLocale);
          case "modern.products.title":
            return resolveLocaleText(themeModernDraft.products.title, pageLocale);
          case "modern.testimonials.label":
            return resolveLocaleText(themeModernDraft.testimonials.label, pageLocale);
          case "modern.testimonials.title":
            return resolveLocaleText(themeModernDraft.testimonials.title, pageLocale);
          case "modern.footer.brandName":
            return resolveLocaleText(themeModernDraft.meta.pageName, pageLocale);
          case "modern.footer.summary":
            return resolveLocaleText(themeModernDraft.footer.summary, pageLocale);
          case "modern.footer.links":
            return joinEditableList(themeModernDraft.footer.links[pageLocale]);
          case "modern.footer.supportItems":
            return joinEditableList(themeModernDraft.footer.supportItems[pageLocale]);
          case "modern.contact.items":
            return [
              contactInfoDraft.hotline,
              contactInfoDraft.email,
              contactInfoDraft.storeAddress,
            ]
              .map((entry) => entry.trim())
              .filter((entry) => entry.length > 0)
              .join("\n");
          default:
            return "";
        }
      }

      if (activeTemplateKind === "legacy-default") {
        const testimonialNode = parseDefaultTestimonialNodeId(nodeId);
        if (testimonialNode) {
          const testimonial = testimonialBundles[testimonialNode.index];
          if (!testimonial) return "";
          if (testimonialNode.field === "text") {
            return pageLocale === "vi" ? testimonial.viText : testimonial.enText;
          }
          return pageLocale === "vi" ? testimonial.viName : testimonial.enName;
        }

        switch (nodeId) {
          case "default.meta.pageLogo":
            return pageLogoUrl;
          case "default.meta.pageName":
            return pageLocale === "vi" ? pageNameVi : pageNameEn;
          case "default.hero.badge":
            return heroBadge;
          case "default.hero.heading":
            return heroHeading;
          case "default.hero.subheading":
            return heroSubheading;
          case "default.hero.searchPlaceholder":
            return heroSearchPlaceholder;
          case "default.featured.title":
            return featuredTitle;
          case "default.featured.showMoreLabel":
            return featuredShowMoreLabel;
          case "default.contact.hotline":
            return contactInfoDraft.hotline;
          case "default.contact.address":
            return contactInfoDraft.storeAddress;
          case "default.contact.email":
            return contactInfoDraft.email;
          default:
            return "";
        }
      }

      return "";
    },
    [
      activeTemplateKind,
      contactInfoDraft.hotline,
      contactInfoDraft.storeAddress,
      contactInfoDraft.email,
      featuredShowMoreLabel,
      featuredTitle,
      heroBadge,
      heroHeading,
      heroSearchPlaceholder,
      heroSubheading,
      pageLocale,
      pageLogoUrl,
      pageNameEn,
      pageNameVi,
      theme3dDraft.collection.highlight,
      theme3dDraft.collection.title,
      theme3dDraft.cta.titleHighlight,
      theme3dDraft.cta.titleLine1,
      theme3dDraft.footer.categories,
      theme3dDraft.footer.summary,
      theme3dDraft.footer.supportItems,
      theme3dDraft.hero.badge,
      theme3dDraft.hero.heroImagePath,
      theme3dDraft.hero.highlight,
      theme3dDraft.hero.line1,
      theme3dDraft.hero.line3,
      theme3dDraft.hero.subtitle,
      theme3dDraft.meta.pageLogoUrl,
      theme3dDraft.meta.pageName,
      theme3dDraft.reviews.label,
      theme3dDraft.reviews.titleLine1,
      theme3dDraft.reviews.titleLine2,
      theme3dDraft.services.whyChoosePrefix,
      theme3dDraft.stats,
      theme3dDraft.testimonials,
      themeCharmDraft.footer.products,
      themeCharmDraft.footer.summary,
      themeCharmDraft.footer.support,
      themeCharmDraft.featureItems,
      themeCharmDraft.featured.subtitle,
      themeCharmDraft.featured.title,
      themeCharmDraft.features.subtitle,
      themeCharmDraft.features.title,
      themeCharmDraft.hero.badge,
      themeCharmDraft.hero.heroImagePath,
      themeCharmDraft.hero.line1,
      themeCharmDraft.hero.line2,
      themeCharmDraft.hero.subtitle,
      themeCharmDraft.meta.pageLogoUrl,
      themeCharmDraft.meta.pageName,
      themeCharmDraft.testimonials.subtitle,
      themeCharmDraft.testimonials.title,
      themeCharmDraft.testimonialItems,
      themeModernDraft.hero.badge,
      themeModernDraft.hero.heroImagePath,
      themeModernDraft.hero.line1,
      themeModernDraft.hero.line2,
      themeModernDraft.hero.subtitle,
      themeModernDraft.meta.pageName,
      themeModernDraft.meta.pageLogoUrl,
      themeModernDraft.footer.links,
      themeModernDraft.footer.summary,
      themeModernDraft.footer.supportItems,
      themeModernDraft.products.label,
      themeModernDraft.products.title,
      themeModernDraft.testimonials.label,
      themeModernDraft.testimonials.title,
      themeModernDraft.testimonialItems,
      testimonialBundles,
    ]
  );

  const setNodeValue = useCallback(
    (nodeId: string, nextValue: string) => {
      if (activeTemplateKind === "theme-charm") {
        if (nodeId === "charm.contact.items") {
          const parsed = parseContactInfoEditableValue(nextValue);
          updateContactInfo("hotline", parsed.hotline);
          updateContactInfo("email", parsed.email);
          updateContactInfo("storeAddress", parsed.storeAddress);
          return;
        }
        const testimonialNode = parseCharmTestimonialNodeId(nodeId);
        if (testimonialNode) {
          setThemeCharmDraft((previous) => {
            const entry = previous.testimonialItems[testimonialNode.index];
            if (!entry) return previous;
            const nextItems = previous.testimonialItems.map((item, index) => {
              if (index !== testimonialNode.index) return item;
              if (testimonialNode.field === "quote") {
                return {
                  ...item,
                  quote: withLocaleText(item.quote, pageLocale, nextValue),
                };
              }
              if (testimonialNode.field === "name") {
                return {
                  ...item,
                  name: withLocaleText(item.name, pageLocale, nextValue),
                };
              }
              return {
                ...item,
                role: withLocaleText(item.role, pageLocale, nextValue),
              };
            });
            return {
              ...previous,
              testimonialItems: nextItems,
            };
          });
          return;
        }
        const featureNode = parseCharmFeatureNodeId(nodeId);
        if (featureNode) {
          setThemeCharmDraft((previous) => {
            const entry = previous.featureItems[featureNode.index];
            if (!entry) return previous;
            const nextItems = previous.featureItems.map((item, index) => {
              if (index !== featureNode.index) return item;
              if (featureNode.field === "title") {
                return {
                  ...item,
                  title: withLocaleText(item.title, pageLocale, nextValue),
                };
              }
              return {
                ...item,
                description: withLocaleText(item.description, pageLocale, nextValue),
              };
            });
            return {
              ...previous,
              featureItems: nextItems,
            };
          });
          return;
        }

        setThemeCharmDraft((previous) => {
          switch (nodeId) {
            case "charm.hero.badge":
              return {
                ...previous,
                hero: {
                  ...previous.hero,
                  badge: withLocaleText(previous.hero.badge, pageLocale, nextValue),
                },
              };
            case "charm.hero.line1":
              return {
                ...previous,
                hero: {
                  ...previous.hero,
                  line1: withLocaleText(previous.hero.line1, pageLocale, nextValue),
                },
              };
            case "charm.hero.line2":
              return {
                ...previous,
                hero: {
                  ...previous.hero,
                  line2: withLocaleText(previous.hero.line2, pageLocale, nextValue),
                },
              };
            case "charm.hero.subtitle":
              return {
                ...previous,
                hero: {
                  ...previous.hero,
                  subtitle: withLocaleText(previous.hero.subtitle, pageLocale, nextValue),
                },
              };
            case "charm.hero.image":
              return {
                ...previous,
                hero: {
                  ...previous.hero,
                  heroImagePath: normalizeOptionalImageValue(nextValue),
                },
              };
            case "charm.meta.pageLogo":
              return {
                ...previous,
                meta: {
                  ...previous.meta,
                  pageLogoUrl: normalizeOptionalImageValue(nextValue),
                },
              };
            case "charm.featured.title":
              return {
                ...previous,
                featured: {
                  ...previous.featured,
                  title: withLocaleText(previous.featured.title, pageLocale, nextValue),
                },
              };
            case "charm.featured.subtitle":
              return {
                ...previous,
                featured: {
                  ...previous.featured,
                  subtitle: withLocaleText(previous.featured.subtitle, pageLocale, nextValue),
                },
              };
            case "charm.features.title":
              return {
                ...previous,
                features: {
                  ...previous.features,
                  title: withLocaleText(previous.features.title, pageLocale, nextValue),
                },
              };
            case "charm.features.subtitle":
              return {
                ...previous,
                features: {
                  ...previous.features,
                  subtitle: withLocaleText(previous.features.subtitle, pageLocale, nextValue),
                },
              };
            case "charm.testimonials.title":
              return {
                ...previous,
                testimonials: {
                  ...previous.testimonials,
                  title: withLocaleText(previous.testimonials.title, pageLocale, nextValue),
                },
              };
            case "charm.testimonials.subtitle":
              return {
                ...previous,
                testimonials: {
                  ...previous.testimonials,
                  subtitle: withLocaleText(previous.testimonials.subtitle, pageLocale, nextValue),
                },
              };
            case "charm.footer.brandName":
              return {
                ...previous,
                meta: {
                  ...previous.meta,
                  pageName: withLocaleText(previous.meta.pageName, pageLocale, nextValue),
                },
              };
            case "charm.footer.summary":
              return {
                ...previous,
                footer: {
                  ...previous.footer,
                  summary: withLocaleText(previous.footer.summary, pageLocale, nextValue),
                },
              };
            case "charm.footer.products": {
              const nextItems = parseEditableList(nextValue);
              return {
                ...previous,
                footer: {
                  ...previous.footer,
                  products: {
                    ...previous.footer.products,
                    [pageLocale]: nextItems,
                  },
                },
              };
            }
            case "charm.footer.support": {
              const nextItems = parseEditableList(nextValue);
              return {
                ...previous,
                footer: {
                  ...previous.footer,
                  support: {
                    ...previous.footer.support,
                    [pageLocale]: nextItems,
                  },
                },
              };
            }
            default:
              return previous;
          }
        });
        return;
      }

      if (activeTemplateKind === "theme-3d") {
        if (nodeId === "3d.contact.items") {
          const parsed = parseContactInfoEditableValue(nextValue);
          updateContactInfo("hotline", parsed.hotline);
          updateContactInfo("email", parsed.email);
          updateContactInfo("storeAddress", parsed.storeAddress);
          return;
        }

        setTheme3dDraft((previous) => {
          const statsNode = parse3dStatsNodeId(nodeId);
          if (statsNode) {
            const currentEntry = previous.stats[statsNode.index];
            if (!currentEntry) return previous;
            const nextStats = previous.stats.map((entry, index) => {
              if (index !== statsNode.index) return entry;
              if (statsNode.field === "label") {
                return {
                  ...entry,
                  label: withLocaleText(entry.label, pageLocale, nextValue),
                };
              }
              const parsed = parseStatCounterInput(nextValue, entry.value, entry.suffix);
              return {
                ...entry,
                value: parsed.value,
                suffix: parsed.suffix,
              };
            });

            return {
              ...previous,
              stats: nextStats,
            };
          }
          const reviewNode = parse3dReviewNodeId(nodeId);
          if (reviewNode) {
            const entry = previous.testimonials[reviewNode.index];
            if (!entry) return previous;
            const nextItems = previous.testimonials.map((item, index) => {
              if (index !== reviewNode.index) return item;
              if (reviewNode.field === "text") {
                return {
                  ...item,
                  text: withLocaleText(item.text, pageLocale, nextValue),
                };
              }
              if (reviewNode.field === "name") {
                return {
                  ...item,
                  name: withLocaleText(item.name, pageLocale, nextValue),
                };
              }
              return {
                ...item,
                role: withLocaleText(item.role, pageLocale, nextValue),
              };
            });
            return {
              ...previous,
              testimonials: nextItems,
            };
          }

          switch (nodeId) {
            case "3d.hero.badge":
              return {
                ...previous,
                hero: {
                  ...previous.hero,
                  badge: withLocaleText(previous.hero.badge, pageLocale, nextValue),
                },
              };
            case "3d.hero.line1":
              return {
                ...previous,
                hero: {
                  ...previous.hero,
                  line1: withLocaleText(previous.hero.line1, pageLocale, nextValue),
                },
              };
            case "3d.hero.highlight":
              return {
                ...previous,
                hero: {
                  ...previous.hero,
                  highlight: withLocaleText(previous.hero.highlight, pageLocale, nextValue),
                },
              };
            case "3d.hero.line3":
              return {
                ...previous,
                hero: {
                  ...previous.hero,
                  line3: withLocaleText(previous.hero.line3, pageLocale, nextValue),
                },
              };
            case "3d.hero.subtitle":
              return {
                ...previous,
                hero: {
                  ...previous.hero,
                  subtitle: withLocaleText(previous.hero.subtitle, pageLocale, nextValue),
                },
              };
            case "3d.hero.image":
              return {
                ...previous,
                hero: {
                  ...previous.hero,
                  heroImagePath: normalizeOptionalImageValue(nextValue),
                },
              };
            case "3d.meta.pageLogo":
              return {
                ...previous,
                meta: {
                  ...previous.meta,
                  pageLogoUrl: normalizeOptionalImageValue(nextValue),
                },
              };
            case "3d.collection.title":
              return {
                ...previous,
                collection: {
                  ...previous.collection,
                  title: withLocaleText(previous.collection.title, pageLocale, nextValue),
                },
              };
            case "3d.collection.highlight":
              return {
                ...previous,
                collection: {
                  ...previous.collection,
                  highlight: withLocaleText(previous.collection.highlight, pageLocale, nextValue),
                },
              };
            case "3d.services.whyChoosePrefix":
              return {
                ...previous,
                services: {
                  ...previous.services,
                  whyChoosePrefix: withLocaleText(
                    previous.services.whyChoosePrefix,
                    pageLocale,
                    nextValue
                  ),
                },
              };
            case "3d.reviews.titleLine1":
              return {
                ...previous,
                reviews: {
                  ...previous.reviews,
                  titleLine1: withLocaleText(previous.reviews.titleLine1, pageLocale, nextValue),
                },
              };
            case "3d.reviews.titleLine2":
              return {
                ...previous,
                reviews: {
                  ...previous.reviews,
                  titleLine2: withLocaleText(previous.reviews.titleLine2, pageLocale, nextValue),
                },
              };
            case "3d.reviews.label":
              return {
                ...previous,
                reviews: {
                  ...previous.reviews,
                  label: withLocaleText(previous.reviews.label, pageLocale, nextValue),
                },
              };
            case "3d.cta.titleLine1":
              return {
                ...previous,
                cta: {
                  ...previous.cta,
                  titleLine1: withLocaleText(previous.cta.titleLine1, pageLocale, nextValue),
                },
              };
            case "3d.cta.titleHighlight":
              return {
                ...previous,
                cta: {
                  ...previous.cta,
                  titleHighlight: withLocaleText(
                    previous.cta.titleHighlight,
                    pageLocale,
                    nextValue
                  ),
                },
              };
            case "3d.footer.brandName":
              return {
                ...previous,
                meta: {
                  ...previous.meta,
                  pageName: withLocaleText(previous.meta.pageName, pageLocale, nextValue),
                },
              };
            case "3d.footer.summary":
              return {
                ...previous,
                footer: {
                  ...previous.footer,
                  summary: withLocaleText(previous.footer.summary, pageLocale, nextValue),
                },
              };
            case "3d.footer.categories": {
              const nextItems = parseEditableList(nextValue);
              return {
                ...previous,
                footer: {
                  ...previous.footer,
                  categories: {
                    ...previous.footer.categories,
                    [pageLocale]: nextItems,
                  },
                },
              };
            }
            case "3d.footer.supportItems": {
              const nextItems = parseEditableList(nextValue);
              return {
                ...previous,
                footer: {
                  ...previous.footer,
                  supportItems: {
                    ...previous.footer.supportItems,
                    [pageLocale]: nextItems,
                  },
                },
              };
            }
            default:
              return previous;
          }
        });
        return;
      }

      if (activeTemplateKind === "theme-modern") {
        if (nodeId === "modern.contact.items") {
          const parsed = parseContactInfoEditableValue(nextValue);
          updateContactInfo("hotline", parsed.hotline);
          updateContactInfo("email", parsed.email);
          updateContactInfo("storeAddress", parsed.storeAddress);
          return;
        }
        const testimonialNode = parseModernTestimonialNodeId(nodeId);
        if (testimonialNode) {
          setThemeModernDraft((previous) => {
            const entry = previous.testimonialItems[testimonialNode.index];
            if (!entry) return previous;
            const nextItems = previous.testimonialItems.map((item, index) => {
              if (index !== testimonialNode.index) return item;
              if (testimonialNode.field === "text") {
                return {
                  ...item,
                  text: withLocaleText(item.text, pageLocale, nextValue),
                };
              }
              return {
                ...item,
                name: withLocaleText(item.name, pageLocale, nextValue),
              };
            });
            return {
              ...previous,
              testimonialItems: nextItems,
            };
          });
          return;
        }

        setThemeModernDraft((previous) => {
          switch (nodeId) {
            case "modern.hero.badge":
              return {
                ...previous,
                hero: {
                  ...previous.hero,
                  badge: withLocaleText(previous.hero.badge, pageLocale, nextValue),
                },
              };
            case "modern.hero.line1":
              return {
                ...previous,
                hero: {
                  ...previous.hero,
                  line1: withLocaleText(previous.hero.line1, pageLocale, nextValue),
                },
              };
            case "modern.hero.line2":
              return {
                ...previous,
                hero: {
                  ...previous.hero,
                  line2: withLocaleText(previous.hero.line2, pageLocale, nextValue),
                },
              };
            case "modern.hero.subtitle":
              return {
                ...previous,
                hero: {
                  ...previous.hero,
                  subtitle: withLocaleText(previous.hero.subtitle, pageLocale, nextValue),
                },
              };
            case "modern.hero.image":
              return {
                ...previous,
                hero: {
                  ...previous.hero,
                  heroImagePath: normalizeOptionalImageValue(nextValue),
                },
              };
            case "modern.meta.pageLogo":
              return {
                ...previous,
                meta: {
                  ...previous.meta,
                  pageLogoUrl: normalizeOptionalImageValue(nextValue),
                },
              };
            case "modern.products.label":
              return {
                ...previous,
                products: {
                  ...previous.products,
                  label: withLocaleText(previous.products.label, pageLocale, nextValue),
                },
              };
            case "modern.products.title":
              return {
                ...previous,
                products: {
                  ...previous.products,
                  title: withLocaleText(previous.products.title, pageLocale, nextValue),
                },
              };
            case "modern.testimonials.label":
              return {
                ...previous,
                testimonials: {
                  ...previous.testimonials,
                  label: withLocaleText(previous.testimonials.label, pageLocale, nextValue),
                },
              };
            case "modern.testimonials.title":
              return {
                ...previous,
                testimonials: {
                  ...previous.testimonials,
                  title: withLocaleText(previous.testimonials.title, pageLocale, nextValue),
                },
              };
            case "modern.footer.brandName":
              return {
                ...previous,
                meta: {
                  ...previous.meta,
                  pageName: withLocaleText(previous.meta.pageName, pageLocale, nextValue),
                },
              };
            case "modern.footer.summary":
              return {
                ...previous,
                footer: {
                  ...previous.footer,
                  summary: withLocaleText(previous.footer.summary, pageLocale, nextValue),
                },
              };
            case "modern.footer.links": {
              const nextItems = parseEditableList(nextValue);
              return {
                ...previous,
                footer: {
                  ...previous.footer,
                  links: {
                    ...previous.footer.links,
                    [pageLocale]: nextItems,
                  },
                },
              };
            }
            case "modern.footer.supportItems": {
              const nextItems = parseEditableList(nextValue);
              return {
                ...previous,
                footer: {
                  ...previous.footer,
                  supportItems: {
                    ...previous.footer.supportItems,
                    [pageLocale]: nextItems,
                  },
                },
              };
            }
            default:
              return previous;
          }
        });
        return;
      }

      if (activeTemplateKind === "legacy-default") {
        const testimonialNode = parseDefaultTestimonialNodeId(nodeId);
        if (testimonialNode) {
          if (testimonialNode.field === "name") {
            updateTestimonialBundle(
              testimonialNode.index,
              pageLocale === "vi" ? { viName: nextValue } : { enName: nextValue }
            );
          } else {
            updateTestimonialBundle(
              testimonialNode.index,
              pageLocale === "vi" ? { viText: nextValue } : { enText: nextValue }
            );
          }
          return;
        }

        switch (nodeId) {
          case "default.meta.pageLogo":
            setPageLogoUrl(nextValue);
            return;
          case "default.meta.pageName":
            if (pageLocale === "vi") {
              setPageNameVi(nextValue);
              return;
            }
            setPageNameEn(nextValue);
            return;
          case "default.hero.badge":
            setHeroBadge(nextValue);
            return;
          case "default.hero.heading":
            setHeroHeading(nextValue);
            return;
          case "default.hero.subheading":
            setHeroSubheading(nextValue);
            return;
          case "default.hero.searchPlaceholder":
            setHeroSearchPlaceholder(nextValue);
            return;
          case "default.featured.title":
            setFeaturedTitle(nextValue);
            return;
          case "default.featured.showMoreLabel":
            setFeaturedShowMoreLabel(nextValue);
            return;
          case "default.contact.hotline":
            updateContactInfo("hotline", nextValue);
            return;
          case "default.contact.address":
            updateContactInfo("storeAddress", nextValue);
            return;
          case "default.contact.email":
            updateContactInfo("email", nextValue);
            return;
          default:
            return;
        }
      }
    },
    [
      activeTemplateKind,
      pageLocale,
      setFeaturedShowMoreLabel,
      setFeaturedTitle,
      setHeroBadge,
      setHeroHeading,
      setHeroSearchPlaceholder,
      setHeroSubheading,
      setPageLogoUrl,
      setPageNameEn,
      setPageNameVi,
      setTheme3dDraft,
      setThemeCharmDraft,
      setThemeModernDraft,
      updateTestimonialBundle,
      updateContactInfo,
    ]
  );

  const apply3dHeroFeaturedProduct = useCallback(
    (productId: string) => {
      const selectedProduct = featuredProductOptions.find((entry) => entry.id === productId);
      if (!selectedProduct) return;

      setTheme3dDraft((previous) => {
        const normalizedName = selectedProduct.name.trim();
        const nextHeroImagePath = normalizeOptionalImageValue(
          showroomClientService.resolveCoverImageUrl(selectedProduct.coverImagePath) ??
            selectedProduct.coverImagePath ??
            ""
        ) ?? previous.hero.heroImagePath;
        const nextFeaturedName =
          normalizedName.length > 0
            ? { vi: normalizedName, en: normalizedName }
            : previous.hero.featuredName;

        return {
          ...previous,
          hero: {
            ...previous.hero,
            heroImagePath: nextHeroImagePath,
            featuredName: nextFeaturedName,
            featuredPrice: {
              vi: formatHeroFeaturedPrice(selectedProduct.rentPricePerDay, "vi"),
              en: formatHeroFeaturedPrice(selectedProduct.rentPricePerDay, "en"),
            },
          },
        };
      });
    },
    [featuredProductOptions, setTheme3dDraft]
  );

  const toggleFeaturedSelectionTokens = useCallback(
    (currentTokens: string[], productId: string): string[] => {
      const normalizedProductId = productId.trim();
      if (!normalizedProductId) return currentTokens;

      const selectedProduct = featuredProductMap.get(normalizedProductId) ?? null;
      const selectedCode = selectedProduct?.productCode.trim().toLowerCase() ?? null;

      const isSameProductToken = (token: string): boolean => {
        const trimmed = token.trim();
        if (!trimmed) return false;
        if (trimmed === normalizedProductId) return true;
        if (selectedCode && trimmed.toLowerCase() === selectedCode) return true;
        return featuredProductByCodeMap.get(trimmed.toLowerCase())?.id === normalizedProductId;
      };

      const currentlySelected = currentTokens.some((entry) => isSameProductToken(entry));
      if (currentlySelected) {
        return currentTokens.filter((entry) => !isSameProductToken(entry));
      }

      const retainedTokens = currentTokens.filter((entry) => !isSameProductToken(entry));
      return [normalizedProductId, ...retainedTokens];
    },
    [featuredProductByCodeMap, featuredProductMap]
  );

  const toggleFeaturedProductId = useCallback(
    (productId: string) => {
      if (activeTemplateKind === "theme-charm") {
        setThemeCharmDraft((previous) => ({
          ...previous,
          featuredProductIds: toggleFeaturedSelectionTokens(previous.featuredProductIds, productId),
        }));
        return;
      }

      if (activeTemplateKind === "theme-3d") {
        setTheme3dDraft((previous) => ({
          ...previous,
          featuredProductIds: toggleFeaturedSelectionTokens(previous.featuredProductIds, productId),
        }));
        return;
      }

      if (activeTemplateKind === "theme-modern") {
        setThemeModernDraft((previous) => ({
          ...previous,
          featuredProductIds: toggleFeaturedSelectionTokens(previous.featuredProductIds, productId),
        }));
        return;
      }

      if (activeTemplateKind === "legacy-default") {
        setFeaturedProductIds((previous) => toggleFeaturedSelectionTokens(previous, productId));
      }
    },
    [
      activeTemplateKind,
      setFeaturedProductIds,
      setTheme3dDraft,
      setThemeCharmDraft,
      setThemeModernDraft,
      toggleFeaturedSelectionTokens,
    ]
  );

  const openNode = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const selectedNodeValue = selectedNode ? getNodeValue(selectedNode.id) : "";
  const getNodeDisplayValue = useCallback(
    (nodeId: string) => {
      const nodeType = visualNodeTypeMap.get(nodeId);
      if (!nodeType) return locale === "vi" ? "(không khả dụng)" : "(unavailable)";

      if (activeTemplateKind === "theme-3d" && nodeId === "3d.hero.image") {
        const selectedProduct =
          selected3dHeroProductId === null
            ? null
            : featuredProductOptions.find((entry) => entry.id === selected3dHeroProductId) ?? null;
        if (selectedProduct) {
          return compactSingleLine(
            `${selectedProduct.productCode} - ${selectedProduct.name} | ${formatHeroFeaturedPrice(
              selectedProduct.rentPricePerDay,
              pageLocale
            )}`
          );
        }
      }

      if (nodeType === "featuredProducts") {
        const count = selectedFeaturedProductIds.length;
        if (count === 0) return locale === "vi" ? "Chưa chọn sản phẩm" : "No products selected";
        return locale === "vi" ? `${count} sản phẩm đã chọn` : `${count} selected products`;
      }

      if (nodeType === "socialLinks") {
        const entries: Array<[string, string]> = [
          ["FB", socialLinksDraft.facebook.trim()],
          ["TikTok", socialLinksDraft.tiktok.trim()],
          ["Zalo", socialLinksDraft.zalo.trim()],
          ["Telegram", socialLinksDraft.telegram.trim()],
        ];
        const activeLinks = entries.filter(([, value]) => value.length > 0);
        if (activeLinks.length === 0) {
          return locale === "vi" ? "Chưa có liên kết" : "No social links";
        }
        return compactSingleLine(activeLinks.map(([key, value]) => `${key}: ${value}`).join(" | "));
      }

      if (nodeType === "contactInfo") {
        const entries = [
          contactInfoDraft.hotline.trim(),
          contactInfoDraft.email.trim(),
          contactInfoDraft.storeAddress.trim(),
        ].filter((entry) => entry.length > 0);
        if (entries.length === 0) {
          return locale === "vi" ? "(trống)" : "(empty)";
        }
        if (entries.length === 1) return compactSingleLine(entries[0]);
        return compactSingleLine(`${entries[0]} (+${entries.length - 1})`);
      }

      const rawValue = getNodeValue(nodeId).trim();
      if (!rawValue) return locale === "vi" ? "(trống)" : "(empty)";

      if (nodeType === "textList") {
        const lines = parseEditableList(rawValue);
        if (lines.length === 0) return locale === "vi" ? "(trống)" : "(empty)";
        const firstLabel = parseFooterLinkEntry(lines[0]).label || lines[0];
        if (lines.length === 1) return compactSingleLine(firstLabel);
        return compactSingleLine(`${firstLabel} (+${lines.length - 1})`);
      }

      return compactSingleLine(rawValue);
    },
    [
      activeTemplateKind,
      featuredProductOptions,
      getNodeValue,
      locale,
      pageLocale,
      selected3dHeroProductId,
      selectedFeaturedProductIds.length,
      contactInfoDraft.email,
      contactInfoDraft.hotline,
      contactInfoDraft.storeAddress,
      socialLinksDraft.facebook,
      socialLinksDraft.telegram,
      socialLinksDraft.tiktok,
      socialLinksDraft.zalo,
      visualNodeTypeMap,
    ]
  );

  const previewProductSource = useMemo(() => {
    const selected = selectedFeaturedProductIds
      .map((entry) => featuredProductMap.get(entry))
      .filter((entry): entry is SettingsShowroomFeaturedProductOptionDto => Boolean(entry));

    if (selected.length > 0) {
      return selected;
    }
    return featuredProductOptions.slice(0, 6);
  }, [featuredProductMap, featuredProductOptions, selectedFeaturedProductIds]);

  const previewModel = useMemo<ProductLandingTemplateModel>(() => {
    const localizedCopy = FALLBACK_COPY[locale];
    const resolvedPageName =
      activeTemplateKind === "theme-charm"
        ? resolveLocaleText(themeCharmDraft.meta.pageName, pageLocale)
        : activeTemplateKind === "theme-3d"
          ? resolveLocaleText(theme3dDraft.meta.pageName, pageLocale)
          : activeTemplateKind === "theme-modern"
            ? resolveLocaleText(themeModernDraft.meta.pageName, pageLocale)
            : pageLocale === "vi"
              ? pageNameVi
              : pageNameEn;
    const resolvedHeroBadge =
      activeTemplateKind === "theme-charm"
        ? resolveLocaleText(themeCharmDraft.hero.badge, pageLocale)
        : activeTemplateKind === "theme-3d"
          ? resolveLocaleText(theme3dDraft.hero.badge, pageLocale)
          : activeTemplateKind === "theme-modern"
            ? resolveLocaleText(themeModernDraft.hero.badge, pageLocale)
            : heroBadge;
    const resolvedHeroHeading =
      activeTemplateKind === "theme-charm"
        ? `${resolveLocaleText(themeCharmDraft.hero.line1, pageLocale)} ${resolveLocaleText(themeCharmDraft.hero.line2, pageLocale)}`.trim()
        : activeTemplateKind === "theme-3d"
          ? `${resolveLocaleText(theme3dDraft.hero.line1, pageLocale)} ${resolveLocaleText(theme3dDraft.hero.highlight, pageLocale)} ${resolveLocaleText(theme3dDraft.hero.line3, pageLocale)}`.trim()
          : activeTemplateKind === "theme-modern"
            ? `${resolveLocaleText(themeModernDraft.hero.line1, pageLocale)} ${resolveLocaleText(themeModernDraft.hero.line2, pageLocale)}`.trim()
            : heroHeading;
    const resolvedHeroSubheading =
      activeTemplateKind === "theme-charm"
        ? resolveLocaleText(themeCharmDraft.hero.subtitle, pageLocale)
        : activeTemplateKind === "theme-3d"
          ? resolveLocaleText(theme3dDraft.hero.subtitle, pageLocale)
          : activeTemplateKind === "theme-modern"
            ? resolveLocaleText(themeModernDraft.hero.subtitle, pageLocale)
            : heroSubheading;
    const resolvedSearchPlaceholder =
      activeTemplateKind === "theme-charm"
        ? resolveLocaleText(themeCharmDraft.navigation.searchPlaceholder, pageLocale)
        : activeTemplateKind === "theme-3d"
          ? resolveLocaleText(theme3dDraft.navigation.searchPlaceholder, pageLocale)
          : activeTemplateKind === "theme-modern"
            ? resolveLocaleText(themeModernDraft.navigation.searchPlaceholder, pageLocale)
            : heroSearchPlaceholder;
    const resolvedFeaturedTitle =
      activeTemplateKind === "theme-charm"
        ? resolveLocaleText(themeCharmDraft.featured.title, pageLocale)
        : activeTemplateKind === "theme-3d"
          ? resolveLocaleText(theme3dDraft.collection.title, pageLocale)
          : activeTemplateKind === "theme-modern"
            ? resolveLocaleText(themeModernDraft.products.title, pageLocale)
            : featuredTitle;
    const resolvedFeaturedShowMoreLabel =
      activeTemplateKind === "theme-charm"
        ? resolveLocaleText(themeCharmDraft.featured.showMoreActionLabel, pageLocale)
        : activeTemplateKind === "theme-3d"
          ? resolveLocaleText(theme3dDraft.collection.actionLabel, pageLocale)
          : activeTemplateKind === "theme-modern"
            ? resolveLocaleText(themeModernDraft.products.showMoreActionLabel, pageLocale)
            : featuredShowMoreLabel;
    const legacyPerks = perkBundles
      .map((entry) => ({
        title: pageLocale === "vi" ? entry.viTitle : entry.enTitle,
        description: pageLocale === "vi" ? entry.viDescription : entry.enDescription,
      }))
      .filter((entry) => entry.title.trim().length > 0 || entry.description.trim().length > 0);
    const legacyTestimonials = testimonialBundles
      .map((entry) => ({
        name: pageLocale === "vi" ? entry.viName : entry.enName,
        text: pageLocale === "vi" ? entry.viText : entry.enText,
      }))
      .filter((entry) => entry.name.trim().length > 0 || entry.text.trim().length > 0);

    return {
      copy: {
        heroBadge: localizedCopy.heroBadge,
        heroHeading: localizedCopy.heroHeading,
        heroSubheading: localizedCopy.heroSubheading,
        searchPlaceholder: localizedCopy.searchPlaceholder,
        featuredTitle: localizedCopy.featuredTitle,
        featuredShowMoreLabel: localizedCopy.featuredShowMoreLabel,
        statsTitle: "",
        perksTitle: "",
        testimonialsTitle: "",
        fallbackNotice: localizedCopy.fallbackNotice,
        loading: "",
        emptyFeatured: localizedCopy.emptyFeatured,
        openShowroomAction: "",
      },
      isLoading: false,
      isFeaturedLoading: false,
      isFallback: false,
      templateCode: templateCode ?? "PRODUCT_HOME_V1",
      templateVersion: 1,
      pageName: resolvedPageName,
      pageLogoUrl:
        activeTemplateKind === "theme-charm"
          ? themeCharmDraft.meta.pageLogoUrl
          : activeTemplateKind === "theme-3d"
            ? theme3dDraft.meta.pageLogoUrl
            : activeTemplateKind === "theme-modern"
              ? themeModernDraft.meta.pageLogoUrl
              : normalizeOptionalImageValue(pageLogoUrl),
      socialLinks: parsePublicSocialLinks(socialLinksDraft),
      contactInfo: parsePublicContactInfo(contactInfoDraft),
      heroBadge: resolvedHeroBadge,
      heroHeading: resolvedHeroHeading,
      heroSubheading: resolvedHeroSubheading,
      searchPlaceholder: resolvedSearchPlaceholder,
      featuredTitle: resolvedFeaturedTitle,
      featuredShowMoreLabel: resolvedFeaturedShowMoreLabel,
      featuredProducts: previewProductSource.map(toPreviewProduct),
      stats: [],
      perks: activeTemplateKind === "legacy-default" ? legacyPerks : [],
      testimonials: activeTemplateKind === "legacy-default" ? legacyTestimonials : [],
      branchName: branchLabel,
      branchSlug: null,
      shopDomain: null,
      showroomSlug: null,
      showroomPath: "#",
      themeCharmConfig: activeTemplateKind === "theme-charm" ? themeCharmDraft : null,
      theme3dConfig: activeTemplateKind === "theme-3d" ? theme3dDraft : null,
      themeModernConfig: activeTemplateKind === "theme-modern" ? themeModernDraft : null,
      openShowroom: () => {},
    };
  }, [
    activeTemplateKind,
    branchLabel,
    contactInfoDraft,
    featuredShowMoreLabel,
    featuredTitle,
    heroBadge,
    heroHeading,
    heroSearchPlaceholder,
    heroSubheading,
    locale,
    pageLocale,
    pageLogoUrl,
    pageNameEn,
    pageNameVi,
    perkBundles,
    previewProductSource,
    socialLinksDraft,
    templateCode,
    testimonialBundles,
    theme3dDraft,
    themeCharmDraft,
    themeModernDraft,
  ]);

  return {
    editorMode: effectiveEditorMode,
    setEditorMode,
    canUseVisualEditor,
    activeTemplateKind,
    visualNodes,
    selectedNode,
    selectedNodeValue,
    drawerOpen: effectiveDrawerOpen,
    setDrawerOpen,
    featuredSearch,
    setFeaturedSearch,
    featuredProductOptions,
    filteredFeaturedProductOptions,
    selectedFeaturedProductIds,
    selected3dHeroProductId,
    previewModel,
    bookingActionLabel: FALLBACK_COPY[locale].bookingActionLabel,
    openNode,
    closeDrawer,
    setNodeValue,
    apply3dHeroFeaturedProduct,
    getNodeDisplayValue,
    toggleFeaturedProductId,
    setSelectedNodeId,
    socialLinksDraft,
    updateSocialLink,
    contactInfoDraft,
    updateContactInfo,
  };
}

export type SettingsShowroomVisualEditorModel = ReturnType<
  typeof useSettingsShowroomVisualEditor
>;
