import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Star } from "lucide-react";

const testimonials = [
  { name: "Mai N.", text: "Dịch vụ nhanh và trang phục rất đẹp. Mình rất hài lòng!", rating: 5 },
  { name: "Hùng T.", text: "Nhân viên tư vấn đúng nhu cầu, dễ chọn đồ. Sẽ quay lại lần sau.", rating: 5 },
  { name: "Hương L.", text: "Đặt online nhanh, đến phòng trưng bày thử là có ngay. Quá tiện!", rating: 5 },
];

const TestimonialsSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section ref={ref} className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-primary text-sm font-semibold tracking-wider uppercase">Đánh giá</span>
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-foreground mt-2">
            Khách hàng nói gì
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className={`glass-card p-8 hover-lift transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 0.15}s` }}
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-foreground italic mb-6 leading-relaxed">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold text-sm">{t.name[0]}</span>
                </div>
                <span className="font-semibold text-foreground">{t.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
