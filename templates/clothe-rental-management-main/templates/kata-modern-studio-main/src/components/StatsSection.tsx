import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Award, Heart, Package, Clock } from "lucide-react";

const stats = [
  { icon: Package, value: "500+", label: "Bộ trang phục", delay: 0 },
  { icon: Heart, value: "2,000+", label: "Khách hài lòng", delay: 0.1 },
  { icon: Award, value: "8,000+", label: "Đơn hoàn tất", delay: 0.2 },
  { icon: Clock, value: "5+", label: "Năm kinh nghiệm", delay: 0.3 },
];

const StatsSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section ref={ref} className="py-20 bg-secondary/50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`text-center p-6 rounded-2xl bg-card transition-all duration-700 hover-lift ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${stat.delay}s` }}
            >
              <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
              <div className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
