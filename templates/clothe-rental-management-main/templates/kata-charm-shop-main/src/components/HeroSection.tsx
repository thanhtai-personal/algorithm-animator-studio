import { Search, ArrowRight, Sparkles } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="KATA Shop" className="w-full h-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background" />
      </div>

      <div className="relative container mx-auto px-4 py-20 md:py-32 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm rounded-full border border-border mb-6 animate-slide-up">
          <Sparkles className="w-4 h-4 text-primary animate-sparkle" />
          <span className="text-sm font-semibold text-primary">Bộ sưu tập mới 2026</span>
          <Sparkles className="w-4 h-4 text-primary animate-sparkle" />
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight mb-6 animate-slide-up-delay-1">
          Trang phục cao cấp
          <br />
          <span className="text-primary">cho mọi dịp đặc biệt</span>
          <span className="inline-block ml-2 animate-bounce-soft">✨</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up-delay-2">
          Áo dài, vest, đầm dạ hội — thuê dễ dàng với chất lượng như mới và đa dạng phong cách 💖
        </p>

        {/* Search bar */}
        <div className="max-w-xl mx-auto mb-8 animate-slide-up-delay-3">
          <div className="flex items-center bg-card rounded-full shadow-card border border-border overflow-hidden p-1.5">
            <Search className="w-5 h-5 text-muted-foreground ml-4" />
            <input
              type="text"
              placeholder="Tìm trang phục bạn muốn thử..."
              className="flex-1 px-4 py-3 text-sm outline-none bg-transparent placeholder:text-muted-foreground"
            />
            <button className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-all hover:scale-105">
              Tìm kiếm
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CTA */}
        <div className="animate-slide-up-delay-4">
          <button className="inline-flex items-center gap-2 px-8 py-4 gradient-cute text-primary-foreground rounded-full font-semibold hover:scale-105 transition-all shadow-cute">
            Đặt lịch makeup
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
