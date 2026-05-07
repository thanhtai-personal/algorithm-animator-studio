import { ShoppingBag, Share2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import ShopHeader from "@/components/ShopHeader";
import ShopFooter from "@/components/ShopFooter";

const Cart = () => {
  return (
    <div className="min-h-screen bg-background">
      <ShopHeader />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-2 animate-slide-up">
          <Link
            to="/showroom"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại phòng trưng bày
          </Link>
          <button className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-sm hover:bg-primary/10 transition-colors">
            <Share2 className="w-4 h-4" />
            Chia sẻ
          </button>
        </div>

        <div className="animate-slide-up-delay-1">
          <h1 className="text-3xl font-bold mt-6">Giỏ hàng của bạn</h1>
          <p className="text-muted-foreground mt-2">
            Lưu sẵn các mẫu bạn muốn thử trước khi đến phòng trưng bày.
          </p>
          <p className="text-sm text-muted-foreground mt-1">0 sản phẩm</p>
          <p className="text-xs text-muted-foreground mt-1">
            Chia sẻ sẽ sao chép URL giỏ hàng hiện tại.
          </p>
        </div>

        {/* Empty State */}
        <div className="mt-10 bg-card rounded-2xl p-12 shadow-card text-center animate-slide-up-delay-2">
          <div className="w-20 h-20 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-muted-foreground animate-bounce-soft" />
          </div>
          <h2 className="text-xl font-bold mb-2">Chưa có sản phẩm nào</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Thêm sản phẩm từ trang listing hoặc trang chi tiết vào giỏ hàng.
          </p>
          <Link
            to="/showroom"
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:scale-105 transition-transform text-sm"
          >
            🛍️ Khám phá phòng trưng bày
          </Link>
        </div>
      </div>

      <ShopFooter />
    </div>
  );
};

export default Cart;
