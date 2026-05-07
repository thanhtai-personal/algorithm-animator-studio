import { Truck, ShieldCheck, MessageCircleHeart } from "lucide-react";

const features = [
  {
    icon: Truck,
    title: "Giao nhận linh hoạt",
    desc: "Hỗ trợ giao và nhận theo lịch hẹn phù hợp 🚗",
    gradient: "gradient-cute",
  },
  {
    icon: ShieldCheck,
    title: "Chất lượng kiểm duyệt",
    desc: "Trang phục luôn được kiểm tra trước mỗi đơn thuê ✅",
    gradient: "gradient-lavender",
  },
  {
    icon: MessageCircleHeart,
    title: "Tư vấn nhiệt tình",
    desc: "Đội ngũ hỗ trợ chọn mẫu theo sự kiện và phong cách 💬",
    gradient: "gradient-mint",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
          Vì sao chọn KATA? 💖
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
          Chúng tôi mang đến trải nghiệm thuê trang phục tuyệt vời nhất
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="bg-card rounded-2xl p-8 text-center shadow-cute hover-lift border border-border group"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className={`w-16 h-16 ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                <feature.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
