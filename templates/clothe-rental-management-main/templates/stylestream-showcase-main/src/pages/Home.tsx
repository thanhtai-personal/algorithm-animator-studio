import { Link } from 'react-router-dom';
import { products, formatVND } from '@/data/mock';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Star, Truck, Shield, Clock, ArrowRight, Sparkles, Heart, MapPin, Phone } from 'lucide-react';

const trending = products.slice(0, 4);
const stats = [
  { label: 'Bộ trang phục', value: '500+' },
  { label: 'Khách hàng hài lòng', value: '2,000+' },
  { label: 'Đơn hoàn thành', value: '8,000+' },
  { label: 'Năm kinh nghiệm', value: '5+' },
];
const perks = [
  { icon: Truck, title: 'Giao hàng tận nơi', desc: 'Miễn phí giao & nhận trong nội thành' },
  { icon: Shield, title: 'Cam kết chất lượng', desc: 'Trang phục luôn sạch sẽ, như mới' },
  { icon: Clock, title: 'Thuê linh hoạt', desc: 'Từ 1 ngày đến 1 tuần, tùy nhu cầu' },
  { icon: Heart, title: 'Tư vấn miễn phí', desc: 'Hỗ trợ chọn trang phục phù hợp' },
];
const testimonials = [
  { name: 'Nguyễn Thị Mai', text: 'Dịch vụ tuyệt vời, áo dài rất đẹp và vừa vặn. Sẽ quay lại!', rating: 5 },
  { name: 'Trần Văn Hùng', text: 'Vest chất lượng cao, giao hàng nhanh. Rất hài lòng.', rating: 5 },
  { name: 'Lê Thị Hương', text: 'Đầm dạ hội lộng lẫy, nhân viên tư vấn nhiệt tình.', rating: 4 },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-accent/10" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-56 h-56 bg-accent/20 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 py-24 md:py-36 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="w-4 h-4" /> Bộ sưu tập mới 2026
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight mb-6">
            Trang phục cao cấp
            <br />
            <span className="text-primary">cho mọi dịp đặc biệt</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Áo dài, vest, đầm dạ hội — thuê dễ dàng, giá hợp lý, chất lượng như mới.
            Để mỗi khoảnh khắc đều trọn vẹn.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="rounded-xl text-base px-8 h-12 gap-2">
              <Link to="/showroom">
                Khám phá ngay <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-xl text-base px-8 h-12">
              <Link to="/showroom/shortlist">Xem Shortlist</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <p className="text-3xl md:text-4xl font-extrabold text-primary">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trending */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-1">Xu hướng</p>
            <h2 className="text-2xl md:text-3xl font-bold">Sản phẩm nổi bật</h2>
          </div>
          <Button asChild variant="ghost" className="gap-1 text-primary">
            <Link to="/showroom">Xem tất cả <ArrowRight className="w-4 h-4" /></Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {trending.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Perks */}
      <section className="bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-1">Tại sao chọn chúng tôi</p>
            <h2 className="text-2xl md:text-3xl font-bold">Dịch vụ thuê trang phục hàng đầu</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {perks.map(p => (
              <div key={p.title} className="bg-card rounded-xl border border-border p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <p.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{p.title}</h3>
                <p className="text-sm text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-1">Đánh giá</p>
          <h2 className="text-2xl md:text-3xl font-bold">Khách hàng nói gì</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(t => (
            <div key={t.name} className="bg-card rounded-xl border border-border p-6">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < t.rating ? 'text-primary fill-primary' : 'text-muted-foreground/30'}`} />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mb-4">"{t.text}"</p>
              <p className="text-sm font-semibold">{t.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary/5 border-y border-border">
        <div className="max-w-3xl mx-auto px-4 py-16 md:py-24 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Sẵn sàng tỏa sáng?</h2>
          <p className="text-muted-foreground mb-8">Khám phá bộ sưu tập đa dạng và đặt thuê trang phục chỉ trong vài phút.</p>
          <Button asChild size="lg" className="rounded-xl text-base px-10 h-12 gap-2">
            <Link to="/showroom">
              Đến Showroom <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-2">RentaFash</h3>
            <p className="text-sm text-muted-foreground">Dịch vụ cho thuê trang phục cao cấp hàng đầu Việt Nam.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Liên hệ</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> 123 Nguyễn Huệ, Q.1, TP.HCM</p>
              <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> 0901 234 567</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Liên kết</h4>
            <div className="space-y-1 text-sm">
              <Link to="/showroom" className="block text-muted-foreground hover:text-primary transition-colors">Showroom</Link>
              <Link to="/showroom/shortlist" className="block text-muted-foreground hover:text-primary transition-colors">Shortlist</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-border text-center py-4 text-xs text-muted-foreground">
          © 2026 RentaFash. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
