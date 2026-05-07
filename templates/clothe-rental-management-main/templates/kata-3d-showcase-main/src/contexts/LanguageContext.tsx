import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Lang = "vi" | "en";

const translations: Record<string, Record<Lang, string>> = {
  // Navbar
  "nav.home": { vi: "Trang chủ", en: "Home" },
  "nav.showroom": { vi: "Phòng trưng bày", en: "Showroom" },
  "nav.booking": { vi: "Đặt lịch", en: "Booking" },
  "nav.cart": { vi: "Giỏ hàng", en: "Cart" },
  "nav.login": { vi: "Đăng nhập", en: "Login" },
  "nav.search": { vi: "Tìm trang phục...", en: "Search outfits..." },

  // Hero
  "hero.badge": { vi: "Bộ sưu tập mới 2026", en: "New Collection 2026" },
  "hero.title1": { vi: "Trang phục", en: "Premium" },
  "hero.title2": { vi: "cao cấp", en: "Outfits" },
  "hero.title3": { vi: "cho mọi dịp", en: "for every occasion" },
  "hero.desc": { vi: "Áo dài, vest, đầm dạ hội — thuê dễ dàng với chất lượng như mới và đa dạng phong cách.", en: "Ao dai, suits, evening gowns — easy to rent with like-new quality and diverse styles." },
  "hero.cta1": { vi: "Khám phá ngay", en: "Explore Now" },
  "hero.cta2": { vi: "Đặt lịch makeup", en: "Book Makeup" },
  "hero.featured": { vi: "Nổi bật", en: "Featured" },
  "hero.featuredName": { vi: "Áo Dài Lụa Vàng", en: "Golden Silk Ao Dai" },
  "hero.price": { vi: "500.000đ / ngày", en: "$25 / day" },

  // Stats
  "stats.outfits": { vi: "Bộ trang phục", en: "Outfits" },
  "stats.customers": { vi: "Khách hài lòng", en: "Happy Customers" },
  "stats.orders": { vi: "Đơn hoàn tất", en: "Orders Completed" },
  "stats.years": { vi: "Năm kinh nghiệm", en: "Years Experience" },

  // Products
  "products.label": { vi: "BỘ SƯU TẬP", en: "COLLECTION" },
  "products.title1": { vi: "Sản phẩm", en: "Featured" },
  "products.title2": { vi: "nổi bật", en: "Products" },
  "products.viewAll": { vi: "Xem tất cả", en: "View All" },
  "products.rentNow": { vi: "Thuê ngay", en: "Rent Now" },
  "products.perDay": { vi: "/ ngày", en: "/ day" },

  // Features
  "features.label": { vi: "DỊCH VỤ", en: "SERVICES" },
  "features.title1": { vi: "Tại sao chọn", en: "Why choose" },
  "features.f1.title": { vi: "Giao nhận linh hoạt", en: "Flexible Delivery" },
  "features.f1.desc": { vi: "Hỗ trợ giao và nhận theo lịch hẹn phù hợp với bạn.", en: "Delivery and pickup according to your schedule." },
  "features.f2.title": { vi: "Chất lượng kiểm duyệt", en: "Quality Assured" },
  "features.f2.desc": { vi: "Trang phục luôn được kiểm tra kỹ trước mỗi đơn thuê.", en: "Every outfit is carefully inspected before each rental." },
  "features.f3.title": { vi: "Tư vấn nhanh", en: "Quick Consultation" },
  "features.f3.desc": { vi: "Đội ngũ hỗ trợ chọn mẫu theo sự kiện và phong cách.", en: "Our team helps you choose based on event and style." },
  "features.f4.title": { vi: "Đặt online 24/7", en: "Online 24/7" },
  "features.f4.desc": { vi: "Đặt lịch thuê online mọi lúc, mọi nơi dễ dàng.", en: "Book rentals online anytime, anywhere." },

  // Testimonials
  "testimonials.label": { vi: "ĐÁNH GIÁ", en: "REVIEWS" },
  "testimonials.title1": { vi: "Khách hàng", en: "What customers" },
  "testimonials.title2": { vi: "nói gì", en: "say" },
  "testimonials.t1.role": { vi: "Khách thuê áo dài", en: "Ao Dai Renter" },
  "testimonials.t1.text": { vi: "Dịch vụ nhanh và trang phục rất đẹp. Mình rất hài lòng với chất lượng vải và kiểu dáng.", en: "Fast service and beautiful outfits. Very satisfied with the fabric quality and style." },
  "testimonials.t2.role": { vi: "Khách thuê vest", en: "Suit Renter" },
  "testimonials.t2.text": { vi: "Nhân viên tư vấn đúng nhu cầu, dễ chọn đồ. Vest vừa vặn và sang trọng.", en: "Staff gave great advice, easy to pick. Suit fits perfectly and looks elegant." },
  "testimonials.t3.role": { vi: "Khách thuê đầm dạ hội", en: "Gown Renter" },
  "testimonials.t3.text": { vi: "Đặt online nhanh, đến phòng trưng bày thử là có ngay. Sẽ quay lại lần sau!", en: "Quick online booking, try on at the showroom right away. Will come back!" },

  // CTA
  "cta.title1": { vi: "Sẵn sàng tỏa sáng tại", en: "Ready to shine at" },
  "cta.title2": { vi: "sự kiện tiếp theo", en: "your next event" },
  "cta.desc": { vi: "Đến phòng trưng bày của KATA hoặc đặt online ngay hôm nay.", en: "Visit KATA showroom or book online today." },
  "cta.book": { vi: "Đặt lịch ngay", en: "Book Now" },
  "cta.contact": { vi: "Liên hệ tư vấn", en: "Contact Us" },

  // Footer
  "footer.desc": { vi: "Dịch vụ cho thuê trang phục cao cấp hàng đầu Việt Nam.", en: "Vietnam's leading premium outfit rental service." },
  "footer.categories": { vi: "Danh mục", en: "Categories" },
  "footer.support": { vi: "Hỗ trợ", en: "Support" },
  "footer.contact": { vi: "Liên hệ", en: "Contact" },
  "footer.copyright": { vi: "© 2026 KATA. Tất cả quyền được bảo lưu.", en: "© 2026 KATA. All rights reserved." },
  "footer.aoDai": { vi: "Áo dài", en: "Ao Dai" },
  "footer.vest": { vi: "Vest nam", en: "Men's Suits" },
  "footer.gown": { vi: "Đầm dạ hội", en: "Evening Gowns" },
  "footer.wedding": { vi: "Trang phục cưới", en: "Wedding Outfits" },
  "footer.guide": { vi: "Hướng dẫn thuê", en: "Rental Guide" },
  "footer.policy": { vi: "Chính sách đổi trả", en: "Return Policy" },

  // Showroom
  "showroom.title": { vi: "Phòng trưng bày", en: "Showroom" },
  "showroom.titleAccent": { vi: "cho thuê", en: "for rent" },
  "showroom.desc": { vi: "Chọn trước trang phục bạn muốn thử trước khi đến cửa hàng.", en: "Pre-select outfits you want to try before visiting the store." },
  "showroom.products": { vi: "sản phẩm", en: "products" },
  "showroom.hideFilter": { vi: "Ẩn bộ lọc", en: "Hide Filters" },
  "showroom.showFilter": { vi: "Mở bộ lọc", en: "Show Filters" },
  "showroom.searchName": { vi: "Tìm theo tên", en: "Search by name" },
  "showroom.searchPlaceholder": { vi: "Nhập tên sản phẩm...", en: "Enter product name..." },
  "showroom.category": { vi: "Danh mục", en: "Category" },
  "showroom.gender": { vi: "Giới tính", en: "Gender" },
  "showroom.size": { vi: "Size", en: "Size" },
  "showroom.clearFilter": { vi: "Xóa bộ lọc", en: "Clear Filters" },
  "showroom.noProducts": { vi: "Không tìm thấy sản phẩm phù hợp", en: "No matching products found" },
  "showroom.addToCart": { vi: "Thêm vào giỏ", en: "Add to Cart" },
  "showroom.all": { vi: "Tất cả", en: "All" },
  "showroom.female": { vi: "Nữ", en: "Female" },
  "showroom.male": { vi: "Nam", en: "Male" },

  // Booking
  "booking.label": { vi: "Trang đặt lịch makeup", en: "Makeup Booking Page" },
  "booking.title": { vi: "Đặt lịch makeup", en: "Book Makeup" },
  "booking.titleAccent": { vi: "nhanh", en: "Quick" },
  "booking.desc": { vi: "Nhập lệnh bằng text hoặc voice, hệ thống tự tách dữ liệu và tính thời gian.", en: "Enter command by text or voice, the system auto-parses data and calculates time." },
  "booking.back": { vi: "Quay lại trang sản phẩm", en: "Back to products" },
  "booking.quickTitle": { vi: "Đặt lịch makeup nhanh", en: "Quick Makeup Booking" },
  "booking.guide": { vi: "Hướng dẫn:", en: "Guide:" },
  "booking.analyze": { vi: "Phân tích lệnh", en: "Analyze Command" },
  "booking.clearInput": { vi: "Xóa input", en: "Clear Input" },
  "booking.confirmTitle": { vi: "Xác nhận kết quả phân tích", en: "Confirm Analysis Results" },
  "booking.loginNote": { vi: "Bạn cần đăng nhập để lưu lịch.", en: "You need to login to save bookings." },
  "booking.specialist": { vi: "Chuyên viên", en: "Specialist" },
  "booking.selectSpecialist": { vi: "- Chọn chuyên viên -", en: "- Select specialist -" },
  "booking.numPeople": { vi: "Số người", en: "Number of People" },
  "booking.date": { vi: "Ngày đặt", en: "Booking Date" },
  "booking.startTime": { vi: "Giờ bắt đầu", en: "Start Time" },
  "booking.endTime": { vi: "Giờ kết thúc", en: "End Time" },
  "booking.autoCalc": { vi: "Tự động tính", en: "Auto calculated" },
  "booking.surcharge": { vi: "Phụ phí", en: "Surcharge" },
  "booking.customerName": { vi: "Tên khách hàng", en: "Customer Name" },
  "booking.customerPhone": { vi: "SĐT khách hàng", en: "Customer Phone" },
  "booking.notes": { vi: "Ghi chú", en: "Notes" },
  "booking.save": { vi: "Lưu lịch", en: "Save Booking" },

  // Auth
  "auth.badge": { vi: "KATA AUTH", en: "KATA AUTH" },
  "auth.title": { vi: "Đăng nhập", en: "Login" },
  "auth.titleAccent": { vi: "để tiếp tục", en: "to continue" },
  "auth.desc": { vi: "Lưu dữ liệu chi tiêu của bạn trên cloud", en: "Save your data on the cloud" },
  "auth.note": { vi: "Vui lòng đăng nhập để không mất dữ liệu của bạn", en: "Please login to keep your data safe" },
  "auth.method": { vi: "Phương thức đăng nhập", en: "Login method" },
  "auth.email": { vi: "Email", en: "Email" },
  "auth.phone": { vi: "Số điện thoại", en: "Phone Number" },
  "auth.password": { vi: "Mật khẩu", en: "Password" },
  "auth.forgotPassword": { vi: "Quên mật khẩu?", en: "Forgot password?" },
  "auth.loginBtn": { vi: "Đăng nhập", en: "Login" },
  "auth.or": { vi: "hoặc", en: "or" },
  "auth.google": { vi: "Tiếp tục với Google", en: "Continue with Google" },
  "auth.skipNote": { vi: "Nếu không đăng nhập, dữ liệu chỉ lưu trên thiết bị", en: "Without login, data is saved locally only" },
  "auth.skip": { vi: "Bỏ qua đăng nhập", en: "Skip Login" },

  // Shortlist
  "shortlist.back": { vi: "Quay lại phòng trưng bày", en: "Back to showroom" },
  "shortlist.share": { vi: "Chia sẻ", en: "Share" },
  "shortlist.title": { vi: "Giỏ hàng", en: "Cart" },
  "shortlist.titleAccent": { vi: "của bạn", en: "items" },
  "shortlist.desc": { vi: "Lưu sẵn các mẫu bạn muốn thử trước khi đến phòng trưng bày.", en: "Save outfits you want to try before visiting the showroom." },
  "shortlist.count": { vi: "0 sản phẩm", en: "0 products" },
  "shortlist.shareNote": { vi: "Chia sẻ sẽ sao chép URL giỏ hàng hiện tại.", en: "Share will copy the current cart URL." },
  "shortlist.emptyTitle": { vi: "Chưa có sản phẩm nào", en: "No products yet" },
  "shortlist.emptyDesc": { vi: "Thêm sản phẩm từ trang listing hoặc trang chi tiết vào giỏ hàng.", en: "Add products from the listing or detail page to your cart." },
  "shortlist.explore": { vi: "Khám phá phòng trưng bày", en: "Explore Showroom" },

  // Settings
  "settings.theme": { vi: "Giao diện", en: "Theme" },
  "settings.dark": { vi: "Tối", en: "Dark" },
  "settings.light": { vi: "Sáng", en: "Light" },
  "settings.palette": { vi: "Bảng màu", en: "Palette" },
  "settings.language": { vi: "Ngôn ngữ", en: "Language" },
};

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "vi",
  setLang: () => {},
  t: (key) => key,
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem("kata-lang");
    return (saved === "en" ? "en" : "vi") as Lang;
  });

  const handleSetLang = useCallback((l: Lang) => {
    setLang(l);
    localStorage.setItem("kata-lang", l);
  }, []);

  const t = useCallback(
    (key: string) => translations[key]?.[lang] ?? key,
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
