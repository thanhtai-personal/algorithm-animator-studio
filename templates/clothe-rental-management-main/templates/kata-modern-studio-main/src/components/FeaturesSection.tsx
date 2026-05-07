import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Truck, ShieldCheck, MessageCircle, Sparkles } from "lucide-react";

const features = [
  { icon: Truck, title: "Giao nhận linh hoạt", desc: "Hỗ trợ giao và nhận theo lịch hẹn phù hợp với bạn." },
  { icon: ShieldCheck, title: "Chất lượng kiểm duyệt", desc: "Trang phục luôn được kiểm tra trước mỗi đơn thuê." },
  { icon: MessageCircle, title: "Tư vấn nhanh", desc: "Đội ngũ hỗ trợ chọn mẫu theo sự kiện và phong cách." },
  { icon: Sparkles, title: "Makeup chuyên nghiệp", desc: "Dịch vụ makeup đi kèm cho trải nghiệm trọn vẹn." },
];

const FeaturesSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section ref={ref} className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-primary text-sm font-semibold tracking-wider uppercase">Tại sao chọn chúng tôi</span>
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-foreground mt-2">
            Dịch vụ tận tâm
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`glass-card p-8 text-center hover-lift transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 0.1}s` }}
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <f.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
