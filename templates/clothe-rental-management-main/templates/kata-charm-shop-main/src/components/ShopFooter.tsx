import { Sparkles, Heart } from "lucide-react";

const ShopFooter = () => {
  return (
    <footer className="bg-muted/50 border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-xl font-bold text-primary">KATA</span>
              <span className="font-accent text-lg text-muted-foreground">Shop</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Cho thuê trang phục cao cấp — nơi bạn tỏa sáng ✨
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-foreground mb-4">Sản phẩm</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="hover:text-primary transition-colors cursor-pointer">Áo dài</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Vest nam</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Đầm dạ hội</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Váy cưới</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-foreground mb-4">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="hover:text-primary transition-colors cursor-pointer">Hướng dẫn thuê</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Chính sách đổi trả</li>
              <li className="hover:text-primary transition-colors cursor-pointer">FAQ</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Liên hệ</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-foreground mb-4">Liên hệ</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>📍 123 Nguyễn Huệ, Q.1, TP.HCM</li>
              <li>📞 0909 123 456</li>
              <li>📧 hello@katashop.vn</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-6 text-center text-sm text-muted-foreground">
          Made with <Heart className="w-3 h-3 inline text-primary fill-primary" /> by KATA Shop © 2026
        </div>
      </div>
    </footer>
  );
};

export default ShopFooter;
