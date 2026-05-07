import { Truck, ShieldCheck, MessageCircle, Clock } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useLanguage } from "@/contexts/LanguageContext";

const FeaturesSection = () => {
  const sectionRef = useScrollAnimation();
  const { t } = useLanguage();

  const features = [
    { icon: Truck, title: t("features.f1.title"), desc: t("features.f1.desc") },
    { icon: ShieldCheck, title: t("features.f2.title"), desc: t("features.f2.desc") },
    { icon: MessageCircle, title: t("features.f3.title"), desc: t("features.f3.desc") },
    { icon: Clock, title: t("features.f4.title"), desc: t("features.f4.desc") },
  ];

  return (
    <section ref={sectionRef} className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16 animate-on-scroll">
          <p className="text-primary text-sm font-medium mb-2">{t("features.label")}</p>
          <h2 className="text-3xl md:text-5xl font-bold">
            {t("features.title1")} <span className="text-gradient">KATA</span>?
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <div key={i} className="animate-on-scroll glass-hover rounded-2xl p-8 group text-center" style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-500">
                <feature.icon className="text-primary" size={24} />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
