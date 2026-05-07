import { Star, Quote } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useLanguage } from "@/contexts/LanguageContext";

const TestimonialsSection = () => {
  const sectionRef = useScrollAnimation();
  const { t } = useLanguage();

  const testimonials = [
    { name: "Mai N.", role: t("testimonials.t1.role"), text: t("testimonials.t1.text"), rating: 5 },
    { name: "Hùng T.", role: t("testimonials.t2.role"), text: t("testimonials.t2.text"), rating: 5 },
    { name: "Hương L.", role: t("testimonials.t3.role"), text: t("testimonials.t3.text"), rating: 5 },
  ];

  return (
    <section ref={sectionRef} className="py-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 animate-on-scroll">
          <p className="text-primary text-sm font-medium mb-2">{t("testimonials.label")}</p>
          <h2 className="text-3xl md:text-5xl font-bold">
            {t("testimonials.title1")} <span className="text-gradient">{t("testimonials.title2")}</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((te, i) => (
            <div key={te.name} className="animate-on-scroll glass-hover rounded-2xl p-8 relative" style={{ transitionDelay: `${i * 150}ms` }}>
              <Quote className="text-primary/20 absolute top-6 right-6" size={40} />
              <div className="flex gap-1 mb-4">
                {Array.from({ length: te.rating }).map((_, j) => (
                  <Star key={j} size={14} className="fill-primary text-primary" />
                ))}
              </div>
              <p className="text-foreground leading-relaxed mb-6">"{te.text}"</p>
              <div>
                <p className="font-semibold text-foreground">{te.name}</p>
                <p className="text-muted-foreground text-sm">{te.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
