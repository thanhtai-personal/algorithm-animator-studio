import { ArrowLeft, Share2, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Shortlist = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-24 pb-16 container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-2 animate-fade-in">
            <Link
              to="/showroom"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại phòng trưng bày
            </Link>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors">
              <Share2 className="w-4 h-4" /> Chia sẻ
            </button>
          </div>

          <div className="glass-card p-8 mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Giỏ hàng của bạn</h1>
            <p className="text-muted-foreground">
              Lưu sẵn các mẫu bạn muốn thử trước khi đến phòng trưng bày.
            </p>
            <p className="text-sm text-muted-foreground mt-1">0 sản phẩm</p>
            <p className="text-xs text-muted-foreground mt-2">
              Chia sẻ sẽ sao chép URL giỏ hàng hiện tại.
            </p>
          </div>

          {/* Empty State */}
          <div className="glass-card p-16 text-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-serif text-2xl font-semibold mb-3">Chưa có sản phẩm nào</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Thêm sản phẩm từ trang listing hoặc trang chi tiết vào giỏ hàng.
            </p>
            <Link
              to="/showroom"
              className="btn-primary-glow inline-flex items-center gap-2 text-sm !px-8 !py-3"
            >
              Khám phá phòng trưng bày
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Shortlist;
