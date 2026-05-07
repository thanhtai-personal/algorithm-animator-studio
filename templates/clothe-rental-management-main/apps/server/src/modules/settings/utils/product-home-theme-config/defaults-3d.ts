import { SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_3D } from './constants';
import { localized } from './helpers';
import type { ProductLanding3DThemeConfig } from './types';

export function buildDefaultProductLanding3DThemeConfig(): ProductLanding3DThemeConfig {
  return {
    version: 1,
    themeCode: SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_3D,
    meta: {
      pageName: localized('KATA 3D Showcase', 'KATA 3D Showcase'),
      pageLogoUrl: null,
      seoDescription: localized(
        'Trang phục cao cấp cho mọi dịp đặc biệt.',
        'Premium outfits for every special moment.',
      ),
    },
    navigation: {
      homeLabel: localized('Trang chủ', 'Home'),
      showroomLabel: localized('Phòng trưng bày', 'Showroom'),
      bookingLabel: localized('Đặt lịch', 'Booking'),
      cartLabel: localized('Giỏ hàng', 'Cart'),
      loginLabel: localized('Đăng nhập', 'Login'),
      searchPlaceholder: localized('Tìm trang phục...', 'Search outfits...'),
    },
    hero: {
      badge: localized('Bộ sưu tập mới 2026', 'New Collection 2026'),
      line1: localized('Trang phục', 'Premium'),
      highlight: localized('cao cấp', 'Outfits'),
      line3: localized('cho mọi dịp', 'for every occasion'),
      subtitle: localized(
        'Trang phục thời trang cao cấp - thuê dễ dàng với chất lượng như mới và đa dạng phong cách.',
        'Premium fashion outfits - easy to rent with like-new quality and diverse styles.',
      ),
      primaryActionLabel: localized('Khám phá ngay', 'Explore Now'),
      secondaryActionLabel: localized('Đặt lịch makeup', 'Book Makeup'),
      featuredLabel: localized('Nổi bật', 'Featured'),
      featuredName: localized('Áo Dài Lụa Vàng', 'Golden Silk Ao Dai'),
      featuredPrice: localized('500.000đ / ngày', '$25 / day'),
      heroImagePath: '/template-assets/kata-3d/hero-dress.jpg',
    },
    collection: {
      label: localized('BỘ SƯU TẬP', 'COLLECTION'),
      title: localized('Sản phẩm', 'Featured'),
      highlight: localized('nổi bật', 'Products'),
      actionLabel: localized('Xem tất cả', 'View All'),
      productActionLabel: localized('Thuê ngay', 'Rent Now'),
      productPerDayLabel: localized('/ ngày', '/ day'),
    },
    services: {
      label: localized('DỊCH VỤ', 'SERVICES'),
      whyChoosePrefix: localized('Tại sao chọn', 'Why choose'),
    },
    reviews: {
      label: localized('ĐÁNH GIÁ', 'REVIEWS'),
      titleLine1: localized('Khách hàng', 'What customers'),
      titleLine2: localized('nói gì', 'say'),
    },
    cta: {
      titleLine1: localized('Sẵn sàng tỏa sáng tại', 'Ready to shine at'),
      titleHighlight: localized('sự kiện tiếp theo', 'your next event'),
      subtitle: localized(
        'Đến phòng trưng bày của KATA hoặc đặt online ngay hôm nay.',
        'Visit KATA showroom or book online today.',
      ),
      primaryActionLabel: localized('Đặt lịch ngay', 'Book Now'),
      secondaryActionLabel: localized('Liên hệ tư vấn', 'Contact Us'),
    },
    footer: {
      categoriesTitle: localized('Danh mục', 'Categories'),
      supportTitle: localized('Hỗ trợ', 'Support'),
      contactTitle: localized('Liên hệ', 'Contact'),
      categories: {
        vi: ['Áo dài', 'Vest nam', 'Đầm dạ hội', 'Trang phục cưới'],
        en: ['Ao Dai', "Men's Suits", 'Evening Gowns', 'Wedding Outfits'],
      },
      supportItems: {
        vi: ['Hướng dẫn thuê', 'Chính sách đổi trả', 'FAQ', 'Liên hệ'],
        en: ['Rental Guide', 'Return Policy', 'FAQ', 'Contact'],
      },
      contactAddress: localized(
        '123 Nguyen Hue, Q1, TP.HCM',
        '123 Nguyen Hue, District 1, HCMC',
      ),
      summary: localized(
        'Dịch vụ cho thuê trang phục cao cấp hàng đầu Việt Nam.',
        "Vietnam's leading premium outfit rental service.",
      ),
      copyright: localized(
        '© 2026 KATA. Tất cả quyền được bảo lưu.',
        '© 2026 KATA. All rights reserved.',
      ),
    },
    stats: [
      { value: 500, suffix: '+', label: localized('Bộ trang phục', 'Outfits') },
      {
        value: 2000,
        suffix: '+',
        label: localized('Khách hài lòng', 'Happy Customers'),
      },
      {
        value: 8000,
        suffix: '+',
        label: localized('Đơn hoàn tất', 'Orders Completed'),
      },
      {
        value: 5,
        suffix: '+',
        label: localized('Năm kinh nghiệm', 'Years Experience'),
      },
    ],
    features: [
      {
        title: localized('Giao nhận linh hoạt', 'Flexible Delivery'),
        description: localized(
          'Hỗ trợ giao và nhận theo lịch hẹn phù hợp với bạn.',
          'Delivery and pickup according to your schedule.',
        ),
      },
      {
        title: localized('Chất lượng kiểm duyệt', 'Quality Assured'),
        description: localized(
          'Trang phục luôn được kiểm tra kỹ trước mỗi đơn thuê.',
          'Every outfit is carefully inspected before each rental.',
        ),
      },
      {
        title: localized('Tư vấn nhanh', 'Quick Consultation'),
        description: localized(
          'Đội ngũ hỗ trợ chọn mẫu theo sự kiện và phong cách.',
          'Our team helps you choose based on event and style.',
        ),
      },
      {
        title: localized('Đặt online 24/7', 'Online 24/7'),
        description: localized(
          'Đặt lịch thuê online mọi lúc, mọi nơi dễ dàng.',
          'Book rentals online anytime, anywhere.',
        ),
      },
    ],
    testimonials: [
      {
        name: localized('Mai N.', 'Mai N.'),
        role: localized('Khách thuê áo dài', 'Ao Dai Renter'),
        text: localized(
          'Dịch vụ nhanh và trang phục rất đẹp. Mình rất hài lòng với chất lượng vải và kiểu dáng.',
          'Fast service and beautiful outfits. Very satisfied with the fabric quality and style.',
        ),
      },
      {
        name: localized('Hùng T.', 'Hung T.'),
        role: localized('Khách thuê vest', 'Suit Renter'),
        text: localized(
          'Nhân viên tư vấn đúng nhu cầu, dễ chọn đồ. Vest vừa vặn và sang trọng.',
          'Staff gave great advice, easy to pick. Suit fits perfectly and looks elegant.',
        ),
      },
      {
        name: localized('Hương L.', 'Huong L.'),
        role: localized('Khách thuê đầm dạ hội', 'Gown Renter'),
        text: localized(
          'Đặt online nhanh, đến phòng trưng bày thử là có ngay. Sẽ quay lại lần sau!',
          'Quick online booking, try on at the showroom right away. Will come back!',
        ),
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
    appearance: {
      defaultMode: 'dark',
      defaultPalette: 'gold',
    },
  };
}
