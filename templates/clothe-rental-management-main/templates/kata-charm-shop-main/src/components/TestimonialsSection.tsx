import { Star } from "lucide-react";

const testimonials = [
  {
    quote: "Dịch vụ nhanh và trang phục rất đẹp. Mình rất hài lòng! 🥰",
    name: "Mai N.",
    role: "Khách hàng",
    stars: 5,
  },
  {
    quote: "Nhân viên tư vấn đúng nhu cầu, dễ chọn đồ. Sẽ quay lại lần sau! 💖",
    name: "Hùng T.",
    role: "Khách hàng",
    stars: 5,
  },
  {
    quote: "Đặt online nhanh, đến phòng trưng bày thử là có ngay. Quá tiện lợi! ✨",
    name: "Hương L.",
    role: "Khách hàng",
    stars: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
          Khách hàng nói gì 💬
        </h2>
        <p className="text-center text-muted-foreground mb-12">
          Những chia sẻ chân thực từ khách hàng thân yêu
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-card rounded-2xl p-8 shadow-cute hover-lift border border-border relative"
            >
              {/* Decorative quote */}
              <div className="text-6xl text-primary/20 font-accent absolute top-4 left-6">"</div>

              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>

              <p className="text-foreground mb-6 leading-relaxed relative z-10">
                {t.quote}
              </p>

              <div>
                <div className="font-bold text-foreground">{t.name}</div>
                <div className="text-sm text-muted-foreground">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
