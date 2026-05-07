import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import heroDress from "@/assets/hero-dress.jpg";
import { useLanguage } from "@/contexts/LanguageContext";

const HeroSection = () => {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden grain">
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-float" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-primary/5 rounded-full blur-[100px] animate-float-delayed" />

      <div className="container mx-auto px-6 pt-24 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-xs text-primary animate-fade-in">
              <Sparkles size={14} />
              <span>{t("hero.badge")}</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] animate-fade-in" style={{ animationDelay: "0.1s" }}>
              {t("hero.title1")}
              <br />
              <span className="text-gradient">{t("hero.title2")}</span>
              <br />
              {t("hero.title3")}
            </h1>

            <p className="text-lg text-muted-foreground max-w-md leading-relaxed animate-fade-in" style={{ animationDelay: "0.2s" }}>
              {t("hero.desc")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <Link to="/showroom" className="group flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-lg font-medium hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.6)] transition-all duration-500 hover:scale-105">
                {t("hero.cta1")}
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/booking" className="glass-hover px-8 py-4 rounded-lg font-medium text-foreground text-center">
                {t("hero.cta2")}
              </Link>
            </div>
          </div>

          <div className="relative perspective-card animate-fade-in-right hidden lg:block" style={{ animationDelay: "0.4s" }}>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-2xl blur-2xl group-hover:blur-3xl transition-all duration-700 scale-105" />
              <div className="relative overflow-hidden rounded-2xl card-3d">
                <img src={heroDress} alt="Premium outfit" className="w-full h-[600px] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 glass rounded-xl p-4 animate-float">
                  <p className="text-xs text-muted-foreground">{t("hero.featured")}</p>
                  <p className="font-semibold">{t("hero.featuredName")}</p>
                  <p className="text-primary font-bold mt-1">{t("hero.price")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
