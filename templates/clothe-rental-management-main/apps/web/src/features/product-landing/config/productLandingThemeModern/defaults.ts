import { SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_MODERN } from "@/features/showroom/constants";
import type { ProductLandingModernThemeConfig } from "./types";
import { formatVndCurrency, localized } from "./utils";

export function buildDefaultProductLandingModernThemeConfig(): ProductLandingModernThemeConfig {
  return {
    version: 1,
    themeCode: SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_MODERN,
    meta: {
      pageName: localized("KATA Modern", "KATA Modern"),
      pageLogoUrl: null,
      seoDescription: localized(
        "Trang phục cao cấp cho mọi dịp đặc biệt.",
        "Premium outfits for every special occasion."
      ),
    },
    navigation: {
      homeLabel: localized("Trang chủ", "Home"),
      showroomLabel: localized("Phòng trưng bày", "Showroom"),
      bookingLabel: localized("Đặt lịch", "Booking"),
      cartLabel: localized("Giỏ hàng", "Cart"),
      authActionLabel: localized("Đăng nhập", "Login"),
      searchPlaceholder: localized(
        "Tìm trang phục bạn muốn thử...",
        "Search outfits you want to try..."
      ),
    },
    hero: {
      badge: localized("Bộ sưu tập mới 2026", "New collection 2026"),
      line1: localized("Trang phục cao cấp", "Premium outfits"),
      line2: localized("cho mọi dịp đặc biệt", "for special moments"),
      subtitle: localized(
        "Trang phục thời trang cao cấp - thuê dễ dàng với chất lượng như mới và đa dạng phong cách.",
        "Premium fashion outfits - easy to rent with like-new quality and diverse styles."
      ),
      primaryActionLabel: localized("Khám phá ngay", "Explore now"),
      secondaryActionLabel: localized("Đặt lịch makeup", "Book makeup"),
      heroImagePath: "/template-assets/kata-modern/hero-bg.jpg",
    },
    products: {
      label: localized("Bộ sưu tập", "Collection"),
      title: localized("Sản phẩm nổi bật", "Featured products"),
      showMoreActionLabel: localized("Xem thêm", "Show more"),
    },
    features: {
      label: localized("Tại sao chọn chúng tôi", "Why choose us"),
      title: localized("Dịch vụ tận tâm", "Dedicated services"),
    },
    testimonials: {
      label: localized("Đánh giá", "Reviews"),
      title: localized("Khách hàng nói gì", "What customers say"),
    },
    cta: {
      title: localized("Sẵn sàng tỏa sáng?", "Ready to shine?"),
      subtitle: localized(
        "Đến phòng trưng bày hoặc đặt online ngay hôm nay để chọn bộ trang phục hoàn hảo.",
        "Visit our showroom or book online today to pick your perfect outfit."
      ),
      actionLabel: localized("Đến phòng trưng bày", "Go to showroom"),
    },
    footer: {
      summary: localized(
        "Dịch vụ cho thuê trang phục cao cấp - áo dài, vest, đầm dạ hội và nhiều hơn nữa.",
        "Premium outfit rental service for ao dai, suits, evening gowns, and more."
      ),
      linksTitle: localized("Liên kết", "Links"),
      supportTitle: localized("Hỗ trợ", "Support"),
      links: {
        vi: ["Trang chủ", "Sản phẩm", "Bộ sưu tập", "Liên hệ"],
        en: ["Home", "Products", "Collection", "Contact"],
      },
      supportItems: {
        vi: ["Chính sách thuê", "Đổi trả", "FAQ", "Điều khoản"],
        en: ["Rental policy", "Returns", "FAQ", "Terms"],
      },
      address: localized("123 Nguyễn Huệ, Q.1, TP.HCM", "123 Nguyen Hue, District 1, HCMC"),
      phone: "0901 234 567",
      email: "hello@katashop.vn",
      copyright: localized(
        "© 2026 KATA. Tất cả quyền được bảo lưu.",
        "© 2026 KATA. All rights reserved."
      ),
    },
    stats: [
      { value: "500+", label: localized("Bộ trang phục", "Outfit collection") },
      { value: "2,000+", label: localized("Khách hài lòng", "Happy customers") },
      { value: "8,000+", label: localized("Đơn hoàn tất", "Completed orders") },
      { value: "5+", label: localized("Năm kinh nghiệm", "Years of experience") },
    ],
    featureItems: [
      {
        title: localized("Giao nhận linh hoạt", "Flexible delivery"),
        description: localized(
          "Hỗ trợ giao và nhận theo lịch hẹn phù hợp với bạn.",
          "Delivery and return options tailored to your schedule."
        ),
      },
      {
        title: localized("Chất lượng kiểm duyệt", "Quality controlled"),
        description: localized(
          "Trang phục luôn được kiểm tra trước mỗi đơn thuê.",
          "Every outfit is checked carefully before each rental."
        ),
      },
      {
        title: localized("Tư vấn nhanh", "Fast consultation"),
        description: localized(
          "Đội ngũ hỗ trợ chọn mẫu theo sự kiện và phong cách.",
          "Styling support based on event type and preference."
        ),
      },
      {
        title: localized("Makeup chuyên nghiệp", "Professional makeup"),
        description: localized(
          "Dịch vụ makeup đi kèm cho trải nghiệm trọn vẹn.",
          "Add-on makeup services for a complete experience."
        ),
      },
    ],
    testimonialItems: [
      {
        name: localized("Mai N.", "Mai N."),
        text: localized(
          "Dịch vụ nhanh và trang phục rất đẹp. Mình rất hài lòng!",
          "Fast service and beautiful outfits. Very satisfied!"
        ),
        rating: 5,
      },
      {
        name: localized("Hùng T.", "Hung T."),
        text: localized(
          "Nhân viên tư vấn đúng nhu cầu, dễ chọn đồ. Sẽ quay lại lần sau.",
          "Helpful consultation and easy fitting flow. Will return again."
        ),
        rating: 5,
      },
      {
        name: localized("Hương L.", "Huong L."),
        text: localized(
          "Đặt online nhanh, đến phòng trưng bày thử là có ngay. Quá tiện!",
          "Quick online booking and smooth in-store fitting. So convenient!"
        ),
        rating: 5,
      },
    ],
    featuredCards: [
      {
        id: "modern-mock-product-1",
        imagePath: "/template-assets/kata-modern/product1.jpg",
        name: localized("Áo dài đỏ truyền thống", "Traditional red ao dai"),
        price: localized("350.000đ", formatVndCurrency(350_000, "en")),
        tag: localized("Hot", "Hot"),
      },
      {
        id: "modern-mock-product-2",
        imagePath: "/template-assets/kata-modern/product2.jpg",
        name: localized("Vest xanh navy lịch lãm", "Elegant navy suit"),
        price: localized("400.000đ", formatVndCurrency(400_000, "en")),
        tag: localized("Mới", "New"),
      },
      {
        id: "modern-mock-product-3",
        imagePath: "/template-assets/kata-modern/product3.jpg",
        name: localized("Đầm dạ hội vàng champagne", "Champagne evening gown"),
        price: localized("500.000đ", formatVndCurrency(500_000, "en")),
        tag: null,
      },
      {
        id: "modern-mock-product-4",
        imagePath: "/template-assets/kata-modern/product4.jpg",
        name: localized("Áo dài trắng thêu hoa", "White embroidered ao dai"),
        price: localized("380.000đ", formatVndCurrency(380_000, "en")),
        tag: localized("Yêu thích", "Favorite"),
      },
    ],
    featuredProductIds: [],
    display: {
      showPriceReference: true,
      showSalePriceReference: true,
      showDepositReference: true,
      showSuccessfulRentCount: true,
      showShortlist: true,
    },
  };
}
