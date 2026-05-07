import type { CSSProperties, ComponentType } from "react";
import { Clock, MessageCircle, ShieldCheck, Truck } from "lucide-react";

export type TemplateLang = "vi" | "en";
export type ThemeMode = "dark" | "light";
export type PaletteMode = "gold" | "rose" | "ocean" | "emerald";

export interface TemplateStat {
  value: number;
  suffix: string;
  label: string;
}

export interface TemplateFeature {
  title: string;
  description: string;
}

export interface TemplateTestimonial {
  name: string;
  role: string;
  text: string;
}

export interface TemplateProduct {
  id: string;
  image: string;
  name: string;
  tag: string;
  priceLabel: string;
}

export interface TemplateCopy {
  navHome: string;
  navShowroom: string;
  navBooking: string;
  navCart: string;
  navLogin: string;
  navSearch: string;
  heroBadge: string;
  heroLine1: string;
  heroHighlight: string;
  heroLine3: string;
  heroSubtitle: string;
  heroPrimaryAction: string;
  heroSecondaryAction: string;
  heroFeaturedLabel: string;
  heroFeaturedName: string;
  heroFeaturedPrice: string;
  stats: TemplateStat[];
  collectionLabel: string;
  collectionTitle: string;
  collectionHighlight: string;
  featuredAction: string;
  productAction: string;
  productPerDay: string;
  servicesLabel: string;
  whyChoosePrefix: string;
  reviewsLabel: string;
  reviewsTitle1: string;
  reviewsTitle2: string;
  ctaTitleLine1: string;
  ctaTitleHighlight: string;
  ctaSubtitle: string;
  ctaPrimaryAction: string;
  ctaSecondaryAction: string;
  categoriesTitle: string;
  supportTitle: string;
  contactTitle: string;
  categories: string[];
  supportItems: string[];
  contactAddress: string;
  footerSummary: string;
  footerCopyright: string;
  settingsTitle: string;
  settingsTheme: string;
  settingsDark: string;
  settingsLight: string;
  settingsPalette: string;
  settingsLanguage: string;
  languageEnglish: string;
  languageVietnamese: string;
  products: TemplateProduct[];
  features: TemplateFeature[];
  testimonials: TemplateTestimonial[];
}

export const FEATURE_ICONS: ComponentType<{ size?: number; className?: string }>[] = [
  Truck,
  ShieldCheck,
  MessageCircle,
  Clock,
];

export const PALETTES: Array<{ id: PaletteMode; label: string; color: string }> = [
  { id: "gold", label: "Gold", color: "hsl(40, 55%, 58%)" },
  { id: "rose", label: "Rose", color: "hsl(340, 65%, 58%)" },
  { id: "ocean", label: "Ocean", color: "hsl(200, 80%, 50%)" },
  { id: "emerald", label: "Emerald", color: "hsl(155, 65%, 42%)" },
];

const MODE_TOKENS: Record<ThemeMode, Record<string, string>> = {
  dark: {
    "--kata-background": "240 10% 4%",
    "--kata-foreground": "40 20% 95%",
    "--kata-card": "240 8% 8%",
    "--kata-secondary": "240 6% 14%",
    "--kata-muted": "240 6% 14%",
    "--kata-muted-foreground": "240 5% 55%",
    "--kata-border": "240 6% 18%",
  },
  light: {
    "--kata-background": "40 20% 97%",
    "--kata-foreground": "240 10% 10%",
    "--kata-card": "0 0% 100%",
    "--kata-secondary": "240 5% 92%",
    "--kata-muted": "240 5% 92%",
    "--kata-muted-foreground": "240 4% 46%",
    "--kata-border": "240 6% 85%",
  },
};

const PALETTE_TOKENS: Record<PaletteMode, Record<string, string>> = {
  gold: {
    "--kata-primary": "40 55% 58%",
    "--kata-primary-foreground": "240 10% 4%",
    "--kata-gold": "40 55% 58%",
    "--kata-gold-light": "40 60% 72%",
    "--kata-gold-dark": "40 45% 42%",
  },
  rose: {
    "--kata-primary": "340 65% 58%",
    "--kata-primary-foreground": "0 0% 100%",
    "--kata-gold": "340 65% 58%",
    "--kata-gold-light": "340 70% 72%",
    "--kata-gold-dark": "340 50% 42%",
  },
  ocean: {
    "--kata-primary": "200 80% 50%",
    "--kata-primary-foreground": "0 0% 100%",
    "--kata-gold": "200 80% 50%",
    "--kata-gold-light": "200 85% 65%",
    "--kata-gold-dark": "200 70% 35%",
  },
  emerald: {
    "--kata-primary": "155 65% 42%",
    "--kata-primary-foreground": "0 0% 100%",
    "--kata-gold": "155 65% 42%",
    "--kata-gold-light": "155 60% 55%",
    "--kata-gold-dark": "155 55% 30%",
  },
};

export const TEMPLATE_COPY: Record<TemplateLang, TemplateCopy> = {
  vi: {
    navHome: "Trang chủ",
    navShowroom: "Phòng trưng bày",
    navBooking: "Đặt lịch",
    navCart: "Giỏ hàng",
    navLogin: "Đăng nhập",
    navSearch: "Tìm trang phục...",
    heroBadge: "Bộ sưu tập mới 2026",
    heroLine1: "Trang phục",
    heroHighlight: "cao cấp",
    heroLine3: "cho mọi dịp",
    heroSubtitle: "Áo dài, vest, đầm dạ hội - thuê dễ dàng với chất lượng như mới và đa dạng phong cách.",
    heroPrimaryAction: "Khám phá ngay",
    heroSecondaryAction: "Đặt lịch makeup",
    heroFeaturedLabel: "Nổi bật",
    heroFeaturedName: "Áo Dài Lụa Vàng",
    heroFeaturedPrice: "500.000đ / ngày",
    stats: [
      { value: 500, suffix: "+", label: "Bộ trang phục" },
      { value: 2000, suffix: "+", label: "Khách hài lòng" },
      { value: 8000, suffix: "+", label: "Đơn hoàn tất" },
      { value: 5, suffix: "+", label: "Năm kinh nghiệm" },
    ],
    collectionLabel: "BỘ SƯU TẬP",
    collectionTitle: "Sản phẩm",
    collectionHighlight: "nổi bật",
    featuredAction: "Xem tất cả",
    productAction: "Thuê ngay",
    productPerDay: "/ ngày",
    servicesLabel: "DỊCH VỤ",
    whyChoosePrefix: "Tại sao chọn",
    reviewsLabel: "ĐÁNH GIÁ",
    reviewsTitle1: "Khách hàng",
    reviewsTitle2: "nói gì",
    ctaTitleLine1: "Sẵn sàng tỏa sáng tại",
    ctaTitleHighlight: "sự kiện tiếp theo",
    ctaSubtitle: "Đến phòng trưng bày của KATA hoặc đặt online ngay hôm nay.",
    ctaPrimaryAction: "Đặt lịch ngay",
    ctaSecondaryAction: "Liên hệ tư vấn",
    categoriesTitle: "Danh mục",
    supportTitle: "Hỗ trợ",
    contactTitle: "Liên hệ",
    categories: ["Áo dài", "Vest nam", "Đầm dạ hội", "Trang phục cưới"],
    supportItems: ["Hướng dẫn thuê", "Chính sách đổi trả", "FAQ", "Liên hệ"],
    contactAddress: "123 Nguyen Hue, Q1, TP.HCM",
    footerSummary: "Dịch vụ cho thuê trang phục cao cấp hàng đầu Việt Nam.",
    footerCopyright: "© 2026 KATA. Tất cả quyền được bảo lưu.",
    settingsTitle: "Settings",
    settingsTheme: "Giao diện",
    settingsDark: "Tối",
    settingsLight: "Sáng",
    settingsPalette: "Bảng màu",
    settingsLanguage: "Ngôn ngữ",
    languageEnglish: "English",
    languageVietnamese: "Tiếng Việt",
    products: [
      { id: "kata-3d-product-1", image: "/template-assets/kata-3d/product-1.jpg", name: "Đầm Dạ Hội Đỏ", tag: "Hot", priceLabel: "450.000đ" },
      { id: "kata-3d-product-2", image: "/template-assets/kata-3d/product-2.jpg", name: "Vest Nam Xanh Navy", tag: "Mới", priceLabel: "350.000đ" },
      { id: "kata-3d-product-3", image: "/template-assets/kata-3d/product-3.jpg", name: "Áo Dài Cưới Trắng", tag: "Premium", priceLabel: "600.000đ" },
      { id: "kata-3d-product-4", image: "/template-assets/kata-3d/product-4.jpg", name: "Đầm Cocktail Xanh", tag: "Phổ biến", priceLabel: "380.000đ" },
    ],
    features: [
      { title: "Giao nhận linh hoạt", description: "Hỗ trợ giao và nhận theo lịch hẹn phù hợp với bạn." },
      { title: "Chất lượng kiểm duyệt", description: "Trang phục luôn được kiểm tra kỹ trước mỗi đơn thuê." },
      { title: "Tư vấn nhanh", description: "Đội ngũ hỗ trợ chọn mẫu theo sự kiện và phong cách." },
      { title: "Đặt online 24/7", description: "Đặt lịch thuê online mọi lúc, mọi nơi dễ dàng." },
    ],
    testimonials: [
      { name: "Mai N.", role: "Khách thuê áo dài", text: "Dịch vụ nhanh và trang phục rất đẹp. Mình rất hài lòng với chất lượng vải và kiểu dáng." },
      { name: "Hùng T.", role: "Khách thuê vest", text: "Nhân viên tư vấn đúng nhu cầu, dễ chọn đồ. Vest vừa vặn và sang trọng." },
      { name: "Hương L.", role: "Khách thuê đầm dạ hội", text: "Đặt online nhanh, đến phòng trưng bày thử là có ngay. Sẽ quay lại lần sau!" },
    ],
  },
  en: {
    navHome: "Home",
    navShowroom: "Showroom",
    navBooking: "Booking",
    navCart: "Cart",
    navLogin: "Login",
    navSearch: "Search outfits...",
    heroBadge: "New Collection 2026",
    heroLine1: "Premium",
    heroHighlight: "Outfits",
    heroLine3: "for every occasion",
    heroSubtitle: "Ao dai, suits, evening gowns - easy to rent with like-new quality and diverse styles.",
    heroPrimaryAction: "Explore Now",
    heroSecondaryAction: "Book Makeup",
    heroFeaturedLabel: "Featured",
    heroFeaturedName: "Golden Silk Ao Dai",
    heroFeaturedPrice: "$25 / day",
    stats: [
      { value: 500, suffix: "+", label: "Outfits" },
      { value: 2000, suffix: "+", label: "Happy Customers" },
      { value: 8000, suffix: "+", label: "Orders Completed" },
      { value: 5, suffix: "+", label: "Years Experience" },
    ],
    collectionLabel: "COLLECTION",
    collectionTitle: "Featured",
    collectionHighlight: "Products",
    featuredAction: "View All",
    productAction: "Rent Now",
    productPerDay: "/ day",
    servicesLabel: "SERVICES",
    whyChoosePrefix: "Why choose",
    reviewsLabel: "REVIEWS",
    reviewsTitle1: "What customers",
    reviewsTitle2: "say",
    ctaTitleLine1: "Ready to shine at",
    ctaTitleHighlight: "your next event",
    ctaSubtitle: "Visit KATA showroom or book online today.",
    ctaPrimaryAction: "Book Now",
    ctaSecondaryAction: "Contact Us",
    categoriesTitle: "Categories",
    supportTitle: "Support",
    contactTitle: "Contact",
    categories: ["Ao Dai", "Men's Suits", "Evening Gowns", "Wedding Outfits"],
    supportItems: ["Rental Guide", "Return Policy", "FAQ", "Contact"],
    contactAddress: "123 Nguyen Hue, District 1, HCMC",
    footerSummary: "Vietnam's leading premium outfit rental service.",
    footerCopyright: "© 2026 KATA. All rights reserved.",
    settingsTitle: "Settings",
    settingsTheme: "Theme",
    settingsDark: "Dark",
    settingsLight: "Light",
    settingsPalette: "Palette",
    settingsLanguage: "Language",
    languageEnglish: "English",
    languageVietnamese: "Tiếng Việt",
    products: [
      { id: "kata-3d-product-1", image: "/template-assets/kata-3d/product-1.jpg", name: "Red Evening Gown", tag: "Hot", priceLabel: "$22" },
      { id: "kata-3d-product-2", image: "/template-assets/kata-3d/product-2.jpg", name: "Navy Blue Suit", tag: "New", priceLabel: "$17" },
      { id: "kata-3d-product-3", image: "/template-assets/kata-3d/product-3.jpg", name: "White Wedding Ao Dai", tag: "Premium", priceLabel: "$30" },
      { id: "kata-3d-product-4", image: "/template-assets/kata-3d/product-4.jpg", name: "Blue Cocktail Dress", tag: "Popular", priceLabel: "$19" },
    ],
    features: [
      { title: "Flexible Delivery", description: "Delivery and pickup according to your schedule." },
      { title: "Quality Assured", description: "Every outfit is carefully inspected before each rental." },
      { title: "Quick Consultation", description: "Our team helps you choose based on event and style." },
      { title: "Online 24/7", description: "Book rentals online anytime, anywhere." },
    ],
    testimonials: [
      { name: "Mai N.", role: "Ao Dai Renter", text: "Fast service and beautiful outfits. Very satisfied with the fabric quality and style." },
      { name: "Hung T.", role: "Suit Renter", text: "Staff gave great advice, easy to pick. Suit fits perfectly and looks elegant." },
      { name: "Huong L.", role: "Gown Renter", text: "Quick online booking, try on at the showroom right away. Will come back!" },
    ],
  },
};

export function buildThemeStyle(mode: ThemeMode, palette: PaletteMode): CSSProperties {
  return {
    ...(MODE_TOKENS[mode] as CSSProperties),
    ...(PALETTE_TOKENS[palette] as CSSProperties),
  };
}
