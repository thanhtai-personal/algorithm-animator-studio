import { ArrowRight } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const CTASection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section ref={ref} className="py-24">
      <div className="container mx-auto px-4">
        <div
          className={`relative overflow-hidden rounded-3xl p-12 md:p-20 text-center transition-all duration-1000 ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
          style={{ background: "var(--hero-gradient)" }}
        >
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-primary-foreground/20 floating" />
            <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-primary-foreground/10 floating" style={{ animationDelay: "3s" }} />
          </div>
          <div className="relative z-10">
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-primary-foreground mb-4">
              Sẵn sàng tỏa sáng?
            </h2>
            <p className="text-primary-foreground/80 max-w-md mx-auto mb-8">
              Đến phòng trưng bày hoặc đặt online ngay hôm nay để chọn bộ trang phục hoàn hảo.
            </p>
            <a href="#" className="inline-flex items-center gap-2 bg-primary-foreground text-foreground px-8 py-4 rounded-xl font-medium hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              Đến phòng trưng bày <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
