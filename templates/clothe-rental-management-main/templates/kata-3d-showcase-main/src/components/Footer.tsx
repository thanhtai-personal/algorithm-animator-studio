import { MapPin, Phone, Mail } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border/50 pt-16 pb-8">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gradient">KATA</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{t("footer.desc")}</p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">{t("footer.categories")}</h4>
            {[t("footer.aoDai"), t("footer.vest"), t("footer.gown"), t("footer.wedding")].map((item) => (
              <a key={item} href="#" className="block text-sm text-muted-foreground hover:text-primary transition-colors">{item}</a>
            ))}
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">{t("footer.support")}</h4>
            {[t("footer.guide"), t("footer.policy"), "FAQ", t("footer.contact")].map((item) => (
              <a key={item} href="#" className="block text-sm text-muted-foreground hover:text-primary transition-colors">{item}</a>
            ))}
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">{t("footer.contact")}</h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin size={14} className="text-primary" />
              123 Nguyễn Huệ, Q1, TP.HCM
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone size={14} className="text-primary" />
              0901 234 567
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail size={14} className="text-primary" />
              info@kata.vn
            </div>
          </div>
        </div>

        <div className="border-t border-border/50 pt-8 text-center text-sm text-muted-foreground">
          {t("footer.copyright")}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
