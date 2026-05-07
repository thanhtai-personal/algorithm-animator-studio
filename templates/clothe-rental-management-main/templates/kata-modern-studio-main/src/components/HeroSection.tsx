import { ArrowRight } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-foreground/60" />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/30 via-transparent to-foreground/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="inline-block mb-6 px-5 py-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 backdrop-blur-md opacity-0 animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <span className="text-primary-foreground text-sm font-medium tracking-wider uppercase">Bộ sưu tập mới 2026</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-primary-foreground leading-[1.1] mb-6 opacity-0 animate-fade-up" style={{ animationDelay: "0.4s" }}>
          Trang phục cao cấp
          <br />
          <span className="italic font-normal">cho mọi dịp đặc biệt</span>
        </h1>

        <p className="text-primary-foreground/70 text-base md:text-lg max-w-xl mx-auto mb-10 opacity-0 animate-fade-up" style={{ animationDelay: "0.6s" }}>
          Áo dài, vest, đầm dạ hội — thuê dễ dàng với chất lượng như mới và đa dạng phong cách.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-up" style={{ animationDelay: "0.8s" }}>
          <a href="#products" className="btn-primary-glow flex items-center gap-2 text-sm">
            Khám phá ngay <ArrowRight className="w-4 h-4" />
          </a>
          <a href="#booking" className="px-8 py-4 rounded-xl text-sm font-medium text-primary-foreground border border-primary-foreground/30 hover:bg-primary-foreground/10 transition-all duration-300">
            Đặt lịch makeup
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0 animate-fade-up" style={{ animationDelay: "1.2s" }}>
        <div className="w-6 h-10 rounded-full border-2 border-primary-foreground/40 flex justify-center pt-2">
          <div className="w-1 h-3 rounded-full bg-primary-foreground/60 animate-bounce" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
