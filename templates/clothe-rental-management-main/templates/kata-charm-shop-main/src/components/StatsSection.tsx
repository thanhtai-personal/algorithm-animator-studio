import { useEffect, useRef, useState } from "react";

const stats = [
  { value: 500, suffix: "+", label: "Bộ trang phục", emoji: "👗" },
  { value: 2000, suffix: "+", label: "Khách hài lòng", emoji: "💕" },
  { value: 8000, suffix: "+", label: "Đơn hoàn tất", emoji: "📦" },
  { value: 5, suffix: "+", label: "Năm kinh nghiệm", emoji: "⭐" },
];

const AnimatedCounter = ({ target, suffix }: { target: number; suffix: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          const duration = 2000;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref} className="text-4xl md:text-5xl font-bold text-primary">
      {count.toLocaleString()}{suffix}
    </div>
  );
};

const StatsSection = () => {
  return (
    <section className="py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-card rounded-2xl p-6 text-center shadow-cute hover-lift border border-border"
            >
              <div className="text-3xl mb-2 animate-bounce-soft">{stat.emoji}</div>
              <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              <div className="text-sm text-muted-foreground mt-2 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
