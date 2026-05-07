import { SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_CHARM } from './constants';
import { localized } from './helpers';
import type { ProductLandingCharmThemeConfig } from './types';

export function buildDefaultProductLandingCharmThemeConfig(): ProductLandingCharmThemeConfig {
  return {
    version: 1,
    themeCode: SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_CHARM,
    meta: {
      pageName: localized('KATA Charm', 'KATA Charm'),
      pageLogoUrl: null,
    },
    navigation: {
      homeLabel: localized('Trang chủ', 'Home'),
      showroomLabel: localized('Phòng trưng bày', 'Showroom'),
      bookingLabel: localized('Đặt lịch makeup', 'Book makeup'),
      searchPlaceholder: localized(
        'Tìm trang phục xinh...',
        'Search cute outfits...',
      ),
      signInLabel: localized('Đăng nhập', 'Sign in'),
    },
    hero: {
      badge: localized('Bộ sưu tập dễ thương', 'Cute collection'),
      line1: localized('Trang phục đáng yêu', 'Lovely outfits'),
      line2: localized('cho mọi khoảnh khắc', 'for every special moment'),
      subtitle: localized(
        'Kho đồ xinh xắn giúp bạn nổi bật trong mọi sự kiện.',
        'A charming wardrobe that keeps you glowing at every event.',
      ),
      searchActionLabel: localized('Khám phá ngay', 'Discover now'),
      heroImagePath: '/template-assets/kata-charm/hero-bg.jpg',
    },
    featured: {
      title: localized('Mẫu được yêu thích', 'Most loved picks'),
      subtitle: localized(
        'Chọn nhanh các mẫu đang được khách thuê nhiều.',
        'Quickly browse outfits most loved by customers.',
      ),
      showMoreActionLabel: localized('Xem thêm', 'Show more'),
      rentNowActionLabel: localized('Thuê ngay', 'Rent now'),
    },
    features: {
      title: localized('Lý do khách yêu thích KATA', 'Why customers love KATA'),
      subtitle: localized(
        'Dịch vụ thân thiện, giao nhận linh hoạt, mẫu mã luôn mới.',
        'Friendly service, flexible delivery, and always-fresh collections.',
      ),
    },
    testimonials: {
      title: localized('Khách hàng nói gì', 'What customers say'),
      subtitle: localized(
        'Phản hồi thật từ khách đã trải nghiệm dịch vụ.',
        'Real feedback from customers who tried our service.',
      ),
    },
    cta: {
      title: localized(
        'Sẵn sàng thử outfit xinh?',
        'Ready for your next cute look?',
      ),
      subtitle: localized(
        'Đến showroom để thử trực tiếp hoặc đặt lịch online ngay.',
        'Visit the showroom or book online instantly.',
      ),
      showroomActionLabel: localized('Đến showroom', 'Visit showroom'),
    },
    footer: {
      summary: localized(
        'KATA mang đến trải nghiệm thuê trang phục cao cấp với phong cách dễ thương.',
        'KATA brings premium rental experiences with a charming style.',
      ),
      productsTitle: localized('Sản phẩm', 'Products'),
      supportTitle: localized('Hỗ trợ', 'Support'),
      contactTitle: localized('Liên hệ', 'Contact'),
      products: {
        vi: ['Váy dự tiệc', 'Áo dài', 'Vest', 'Trang phục sự kiện'],
        en: ['Party dresses', 'Ao dai', 'Suits', 'Event outfits'],
      },
      support: {
        vi: ['Hướng dẫn thuê', 'Chính sách đổi trả', 'Câu hỏi thường gặp'],
        en: ['Rental guide', 'Return policy', 'FAQ'],
      },
      contactLines: {
        vi: ['123 Nguyen Hue, Q1, TP.HCM', 'Hotline: 1900 1234'],
        en: ['123 Nguyen Hue, District 1, HCMC', 'Hotline: 1900 1234'],
      },
      madeWith: localized(
        'Được tạo với tình yêu tại KATA',
        'Made with love at KATA',
      ),
    },
    stats: [
      {
        value: 1200,
        suffix: '+',
        label: localized('Khách hàng', 'Customers'),
        emoji: 'heart',
      },
      {
        value: 450,
        suffix: '+',
        label: localized('Mẫu nổi bật', 'Signature outfits'),
        emoji: 'sparkle',
      },
      {
        value: 98,
        suffix: '%',
        label: localized('Hài lòng', 'Satisfaction'),
        emoji: 'smile',
      },
    ],
    products: [
      {
        id: 'kata-charm-product-1',
        name: localized('Đầm hồng pastel', 'Pastel pink dress'),
        price: localized('650.000đ', '650,000 VND'),
        tag: localized('Dễ thương', 'Cute'),
        image: '/template-assets/kata-charm/product1.jpg',
      },
      {
        id: 'kata-charm-product-2',
        name: localized('Váy lấp lánh', 'Sparkle dress'),
        price: localized('720.000đ', '720,000 VND'),
        tag: localized('Nổi bật', 'Signature'),
        image: '/template-assets/kata-charm/product2.jpg',
      },
      {
        id: 'kata-charm-product-3',
        name: localized('Áo dài tông nude', 'Nude tone Ao Dai'),
        price: localized('580.000đ', '580,000 VND'),
        tag: localized('Thanh lịch', 'Elegant'),
        image: '/template-assets/kata-charm/product3.jpg',
      },
    ],
    featureItems: [
      {
        title: localized('Tư vấn tận tâm', 'Dedicated styling'),
        description: localized(
          'Đội ngũ giúp bạn chọn outfit phù hợp sự kiện và vóc dáng.',
          'Our team helps you pick the right look for event and body type.',
        ),
        gradientClass: 'kata-charm-gradient-cute',
      },
      {
        title: localized('Giao nhận linh hoạt', 'Flexible delivery'),
        description: localized(
          'Nhận và trả đồ theo lịch hẹn phù hợp với bạn.',
          'Pickup and return schedules that match your time.',
        ),
        gradientClass: 'kata-charm-gradient-lavender',
      },
      {
        title: localized('Bảo quản chuẩn', 'Premium care'),
        description: localized(
          'Mỗi mẫu đều được vệ sinh và kiểm tra kỹ trước khi giao.',
          'Every outfit is cleaned and quality-checked before delivery.',
        ),
        gradientClass: 'kata-charm-gradient-mint',
      },
    ],
    testimonialItems: [
      {
        quote: localized(
          'Mẫu siêu xinh, mặc lên rất tự tin!',
          'Super cute outfit, felt very confident!',
        ),
        name: localized('Mai N.', 'Mai N.'),
        role: localized('Khách thuê váy', 'Dress renter'),
        stars: 5,
      },
      {
        quote: localized(
          'Tư vấn nhanh, chọn đồ cực hợp.',
          'Fast support and perfect styling advice.',
        ),
        name: localized('Lan H.', 'Lan H.'),
        role: localized('Khách thuê áo dài', 'Ao Dai renter'),
        stars: 5,
      },
      {
        quote: localized(
          'Đặt online tiện và nhận đồ đúng hẹn.',
          'Convenient online booking and timely delivery.',
        ),
        name: localized('Tram P.', 'Tram P.'),
        role: localized('Khách thuê sự kiện', 'Event renter'),
        stars: 5,
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
