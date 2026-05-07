import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useLanguage } from "@/contexts/LanguageContext";

const CTASection = () => {
  const sectionRef = useScrollAnimation();
  const { t } = useLanguage();

  return (
    <section ref={sectionRef} className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />

      <div className="container mx-auto px-6 relative z-10 text-center">
        <div className="animate-on-scroll max-w-2xl mx-auto space-y-8">
          <h2 className="text-3xl md:text-5xl font-bold">
            {t("cta.title1")}
            <br />
            <span className="text-gradient">{t("cta.title2")}</span>?
          </h2>
          <p className="text-muted-foreground text-lg">{t("cta.desc")}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="group flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-lg font-medium animate-pulse-glow hover:scale-105 transition-transform duration-300">
              {t("cta.book")}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="glass-hover px-8 py-4 rounded-lg font-medium text-foreground">
              {t("cta.contact")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
