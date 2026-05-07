import { ArrowLeft, Share2, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";

const Shortlist = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-28 pb-24">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="flex items-center justify-between mb-8 animate-fade-in">
            <Link to="/showroom" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft size={14} />
              {t("shortlist.back")}
            </Link>
            <button className="flex items-center gap-2 text-sm glass px-4 py-2 rounded-full hover:bg-secondary/80 transition-all">
              <Share2 size={14} />
              {t("shortlist.share")}
            </button>
          </div>

          <div className="mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <h1 className="text-3xl md:text-4xl font-bold">
              {t("shortlist.title")} <span className="text-gradient">{t("shortlist.titleAccent")}</span>
            </h1>
            <p className="text-muted-foreground mt-2">{t("shortlist.desc")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("shortlist.count")}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">{t("shortlist.shareNote")}</p>
          </div>

          <div className="glass rounded-2xl p-16 text-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary/50 flex items-center justify-center">
              <ShoppingBag size={32} className="text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-3">{t("shortlist.emptyTitle")}</h2>
            <p className="text-muted-foreground text-sm mb-8 max-w-sm mx-auto">{t("shortlist.emptyDesc")}</p>
            <Link to="/showroom" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.6)] transition-all hover:scale-105">
              {t("shortlist.explore")}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Shortlist;
