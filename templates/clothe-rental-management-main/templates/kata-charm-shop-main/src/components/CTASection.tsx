import { ArrowRight, Sparkles } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="gradient-cute rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
          {/* Decorative */}
          <div className="absolute top-6 left-10 animate-float">
            <Sparkles className="w-8 h-8 text-primary-foreground/30" />
          </div>
          <div className="absolute bottom-10 right-14 animate-float" style={{ animationDelay: "1s" }}>
            <Sparkles className="w-6 h-6 text-primary-foreground/30" />
          </div>
          <div className="absolute top-1/2 right-1/4 animate-bounce-soft">
            <span className="text-2xl">✨</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4 relative z-10">
            Sẵn sàng trở nên lộng lẫy? 💖
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto relative z-10">
            Đến phòng trưng bày để thử ngay hoặc đặt online chỉ trong vài phút
          </p>
          <button className="inline-flex items-center gap-2 px-8 py-4 bg-card text-primary rounded-full font-bold hover:scale-105 transition-all shadow-card relative z-10">
            Đến phòng trưng bày
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
