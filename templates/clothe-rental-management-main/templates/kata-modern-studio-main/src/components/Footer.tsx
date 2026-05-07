import { MapPin, Phone, Mail } from "lucide-react";

const Footer = () => (
  <footer className="bg-foreground text-primary-foreground/70 pt-16 pb-8">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
        <div className="md:col-span-2">
          <h3 className="font-serif text-2xl font-bold text-primary-foreground mb-4">
            KATA<span className="text-primary">.</span>
          </h3>
          <p className="text-sm leading-relaxed max-w-sm mb-6">
            Dịch vụ cho thuê trang phục cao cấp — áo dài, vest, đầm dạ hội và nhiều hơn nữa.
          </p>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> 123 Nguyễn Huệ, Q.1, TP.HCM</div>
            <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary" /> 0901 234 567</div>
            <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> hello@katashop.vn</div>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-primary-foreground mb-4">Liên kết</h4>
          <nav className="flex flex-col gap-2 text-sm">
            {["Trang chủ", "Sản phẩm", "Bộ sưu tập", "Liên hệ"].map((l) => (
              <a key={l} href="#" className="hover:text-primary-foreground transition-colors">{l}</a>
            ))}
          </nav>
        </div>
        <div>
          <h4 className="font-semibold text-primary-foreground mb-4">Hỗ trợ</h4>
          <nav className="flex flex-col gap-2 text-sm">
            {["Chính sách thuê", "Đổi trả", "FAQ", "Điều khoản"].map((l) => (
              <a key={l} href="#" className="hover:text-primary-foreground transition-colors">{l}</a>
            ))}
          </nav>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 pt-8 text-center text-xs">
        © 2026 KATA. Tất cả quyền được bảo lưu.
      </div>
    </div>
  </footer>
);

export default Footer;
