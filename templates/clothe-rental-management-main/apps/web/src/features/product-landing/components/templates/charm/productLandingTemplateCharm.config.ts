import { Calendar, Home, MessageCircleHeart, ShieldCheck, Store, Truck } from "lucide-react";
import type { ComponentType } from "react";
import type { AppLocale } from "@/constants/locale";

export interface TemplateStat {
  value: number;
  suffix: string;
  label: string;
  emoji: string;
}

export interface TemplateProduct {
  id: string;
  name: string;
  price: string;
  tag: string;
  image: string;
}

export interface TemplateFeature {
  title: string;
  description: string;
  gradientClass: string;
}

export interface TemplateTestimonial {
  quote: string;
  name: string;
  role: string;
  stars: number;
}

export interface TemplateNavItem {
  label: string;
  icon: ComponentType<{ className?: string }>;
}

export interface TemplateCopy {
  navItems: TemplateNavItem[];
  searchPlaceholder: string;
  signInLabel: string;
  heroBadge: string;
  heroLine1: string;
  heroLine2: string;
  heroSubtitle: string;
  heroSearchAction: string;
  featuredTitle: string;
  featuredSubtitle: string;
  featuredShowMore: string;
  rentNowAction: string;
  featuresTitle: string;
  featuresSubtitle: string;
  testimonialsTitle: string;
  testimonialsSubtitle: string;
  ctaTitle: string;
  ctaSubtitle: string;
  ctaShowroomAction: string;
  footerSummary: string;
  footerProductsTitle: string;
  footerSupportTitle: string;
  footerContactTitle: string;
  footerProducts: string[];
  footerSupport: string[];
  footerContactLines: string[];
  footerMadeWith: string;
  stats: TemplateStat[];
  products: TemplateProduct[];
  features: TemplateFeature[];
  testimonials: TemplateTestimonial[];
}

export const TEMPLATE_COPY: Record<AppLocale, TemplateCopy> = {
  vi: {
    navItems: [
      { label: "Trang chủ", icon: Home },
      { label: "Phòng trưng bày", icon: Store },
      { label: "Đặt lịch makeup", icon: Calendar },
    ],
    searchPlaceholder: "Tìm trang phục yêu thích...",
    signInLabel: "Đăng nhập",
    heroBadge: "Bộ sưu tập mới 2026",
    heroLine1: "Trang phục cao cấp",
    heroLine2: "cho mọi dịp đặc biệt",
    heroSubtitle: "Áo dài, vest, đầm dạ hội - thuê dễ dàng với chất lượng như mới và đa dạng phong cách.",
    heroSearchAction: "Tìm kiếm",
    featuredTitle: "Sản phẩm nổi bật",
    featuredSubtitle: "Những trang phục được yêu thích nhất",
    featuredShowMore: "Xem thêm",
    rentNowAction: "Thuê ngay",
    featuresTitle: "Vì sao chọn KATA?",
    featuresSubtitle: "Chúng tôi mang đến trải nghiệm thuê trang phục tuyệt vời nhất",
    testimonialsTitle: "Khách hàng nói gì",
    testimonialsSubtitle: "Những chia sẻ chân thực từ khách hàng thân yêu",
    ctaTitle: "Sẵn sàng trở nên lộng lẫy?",
    ctaSubtitle: "Đến phòng trưng bày để thử ngay hoặc đặt online chỉ trong vài phút",
    ctaShowroomAction: "Đến phòng trưng bày",
    footerSummary: "Cho thuê trang phục cao cấp - nơi bạn tỏa sáng.",
    footerProductsTitle: "Sản phẩm",
    footerSupportTitle: "Hỗ trợ",
    footerContactTitle: "Liên hệ",
    footerProducts: ["Áo dài", "Vest nam", "Đầm dạ hội", "Váy cưới"],
    footerSupport: ["Hướng dẫn thuê", "Chính sách đổi trả", "FAQ", "Liên hệ"],
    footerContactLines: ["123 Nguyễn Huệ, Q.1, TP.HCM", "0909 123 456", "hello@katashop.vn"],
    footerMadeWith: "Made with",
    stats: [
      { value: 500, suffix: "+", label: "Bộ trang phục", emoji: "👗" },
      { value: 2000, suffix: "+", label: "Khách hài lòng", emoji: "💕" },
      { value: 8000, suffix: "+", label: "Đơn hoàn tất", emoji: "📦" },
      { value: 5, suffix: "+", label: "Năm kinh nghiệm", emoji: "⭐" },
    ],
    products: [
      {
        id: "kata-charm-product-1",
        name: "Áo Dài Hồng Pastel",
        price: "350,000đ",
        tag: "Mới",
        image: "/template-assets/kata-charm/product1.jpg",
      },
      {
        id: "kata-charm-product-2",
        name: "Vest Xanh Navy",
        price: "500,000đ",
        tag: "Hot",
        image: "/template-assets/kata-charm/product2.jpg",
      },
      {
        id: "kata-charm-product-3",
        name: "Đầm Dạ Hội Đỏ",
        price: "600,000đ",
        tag: "Sang trọng",
        image: "/template-assets/kata-charm/product3.jpg",
      },
      {
        id: "kata-charm-product-4",
        name: "Áo Dài Tím Lavender",
        price: "380,000đ",
        tag: "Dễ thương",
        image: "/template-assets/kata-charm/product4.jpg",
      },
      {
        id: "kata-charm-product-5",
        name: "Váy Cưới Trắng Vàng",
        price: "800,000đ",
        tag: "Premium",
        image: "/template-assets/kata-charm/product5.jpg",
      },
      {
        id: "kata-charm-product-6",
        name: "Đầm Xanh Ngọc",
        price: "450,000đ",
        tag: "Mới",
        image: "/template-assets/kata-charm/product6.jpg",
      },
    ],
    features: [
      {
        title: "Giao nhận linh hoạt",
        description: "Hỗ trợ giao và nhận theo lịch hẹn phù hợp",
        gradientClass: "kata-charm-gradient-cute",
      },
      {
        title: "Chất lượng kiểm duyệt",
        description: "Trang phục luôn được kiểm tra trước mỗi đơn thuê",
        gradientClass: "kata-charm-gradient-lavender",
      },
      {
        title: "Tư vấn nhiệt tình",
        description: "Đội ngũ hỗ trợ chọn mẫu theo sự kiện và phong cách",
        gradientClass: "kata-charm-gradient-mint",
      },
    ],
    testimonials: [
      {
        quote: "Dịch vụ nhanh và trang phục rất đẹp. Mình rất hài lòng!",
        name: "Mai N.",
        role: "Khách hàng",
        stars: 5,
      },
      {
        quote: "Nhân viên tư vấn đúng nhu cầu, dễ chọn đồ. Sẽ quay lại lần sau!",
        name: "Hùng T.",
        role: "Khách hàng",
        stars: 5,
      },
      {
        quote: "Đặt online nhanh, đến phòng trưng bày thử là có ngay. Quá tiện lợi!",
        name: "Hương L.",
        role: "Khách hàng",
        stars: 5,
      },
    ],
  },
  en: {
    navItems: [
      { label: "Home", icon: Home },
      { label: "Showroom", icon: Store },
      { label: "Book makeup", icon: Calendar },
    ],
    searchPlaceholder: "Find your favorite outfit...",
    signInLabel: "Sign in",
    heroBadge: "New collection 2026",
    heroLine1: "Premium outfits",
    heroLine2: "for every special moment",
    heroSubtitle: "Ao dai, suits, and evening dresses with easy rental and delightful styling support.",
    heroSearchAction: "Search",
    featuredTitle: "Featured products",
    featuredSubtitle: "Most loved outfits from our collection",
    featuredShowMore: "View more",
    rentNowAction: "Rent now",
    featuresTitle: "Why choose KATA?",
    featuresSubtitle: "We deliver a delightful rental experience from selection to fitting",
    testimonialsTitle: "What customers say",
    testimonialsSubtitle: "Real stories from our lovely customers",
    ctaTitle: "Ready to shine?",
    ctaSubtitle: "Visit our showroom or complete your booking online in just a few minutes",
    ctaShowroomAction: "Go to showroom",
    footerSummary: "Premium fashion rental - where every look feels special.",
    footerProductsTitle: "Products",
    footerSupportTitle: "Support",
    footerContactTitle: "Contact",
    footerProducts: ["Ao dai", "Men suits", "Evening dresses", "Wedding gowns"],
    footerSupport: ["Rental guide", "Return policy", "FAQ", "Contact"],
    footerContactLines: ["123 Nguyen Hue, District 1, HCMC", "0909 123 456", "hello@katashop.vn"],
    footerMadeWith: "Made with",
    stats: [
      { value: 500, suffix: "+", label: "Outfits", emoji: "👗" },
      { value: 2000, suffix: "+", label: "Happy customers", emoji: "💕" },
      { value: 8000, suffix: "+", label: "Completed orders", emoji: "📦" },
      { value: 5, suffix: "+", label: "Years", emoji: "⭐" },
    ],
    products: [
      {
        id: "kata-charm-product-1",
        name: "Pastel Pink Ao Dai",
        price: "350,000 VND",
        tag: "New",
        image: "/template-assets/kata-charm/product1.jpg",
      },
      {
        id: "kata-charm-product-2",
        name: "Navy Suit",
        price: "500,000 VND",
        tag: "Hot",
        image: "/template-assets/kata-charm/product2.jpg",
      },
      {
        id: "kata-charm-product-3",
        name: "Red Evening Dress",
        price: "600,000 VND",
        tag: "Elegant",
        image: "/template-assets/kata-charm/product3.jpg",
      },
      {
        id: "kata-charm-product-4",
        name: "Lavender Ao Dai",
        price: "380,000 VND",
        tag: "Cute",
        image: "/template-assets/kata-charm/product4.jpg",
      },
      {
        id: "kata-charm-product-5",
        name: "White Gold Wedding Dress",
        price: "800,000 VND",
        tag: "Premium",
        image: "/template-assets/kata-charm/product5.jpg",
      },
      {
        id: "kata-charm-product-6",
        name: "Emerald Blue Dress",
        price: "450,000 VND",
        tag: "New",
        image: "/template-assets/kata-charm/product6.jpg",
      },
    ],
    features: [
      {
        title: "Flexible delivery",
        description: "Delivery and return support aligned with your preferred schedule",
        gradientClass: "kata-charm-gradient-cute",
      },
      {
        title: "Quality control",
        description: "Every outfit is carefully checked before each rental",
        gradientClass: "kata-charm-gradient-lavender",
      },
      {
        title: "Warm consultation",
        description: "Our team helps you choose the best look for every event",
        gradientClass: "kata-charm-gradient-mint",
      },
    ],
    testimonials: [
      {
        quote: "Fast service and gorgeous outfits. I was really satisfied!",
        name: "Mai N.",
        role: "Customer",
        stars: 5,
      },
      {
        quote: "Consultation matched my needs perfectly. Will come back again!",
        name: "Hung T.",
        role: "Customer",
        stars: 5,
      },
      {
        quote: "Online booking was quick and fitting in showroom was super convenient!",
        name: "Huong L.",
        role: "Customer",
        stars: 5,
      },
    ],
  },
};

export const FEATURE_ICONS = [Truck, ShieldCheck, MessageCircleHeart];
