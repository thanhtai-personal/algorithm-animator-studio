import { ArrowRight, Heart } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useLanguage } from "@/contexts/LanguageContext";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";

const ProductsSection = () => {
  const sectionRef = useScrollAnimation();
  const { t, lang } = useLanguage();

  const products = [
    { name: lang === "vi" ? "Đầm Dạ Hội Đỏ" : "Red Evening Gown", price: lang === "vi" ? "450.000đ" : "$22", image: product1, tag: "Hot" },
    { name: lang === "vi" ? "Vest Nam Xanh Navy" : "Navy Blue Suit", price: lang === "vi" ? "350.000đ" : "$17", image: product2, tag: lang === "vi" ? "Mới" : "New" },
    { name: lang === "vi" ? "Áo Dài Cưới Trắng" : "White Wedding Ao Dai", price: lang === "vi" ? "600.000đ" : "$30", image: product3, tag: "Premium" },
    { name: lang === "vi" ? "Đầm Cocktail Xanh" : "Blue Cocktail Dress", price: lang === "vi" ? "380.000đ" : "$19", image: product4, tag: lang === "vi" ? "Phổ biến" : "Popular" },
  ];

  return (
    <section ref={sectionRef} className="py-24">
      <div className="container mx-auto px-6">
        <div className="flex items-end justify-between mb-12 animate-on-scroll">
          <div>
            <p className="text-primary text-sm font-medium mb-2">{t("products.label")}</p>
            <h2 className="text-3xl md:text-5xl font-bold">
              {t("products.title1")} <span className="text-gradient">{t("products.title2")}</span>
            </h2>
          </div>
          <a href="#" className="hidden md:flex items-center gap-2 text-primary hover:gap-3 transition-all duration-300 text-sm">
            {t("products.viewAll")} <ArrowRight size={16} />
          </a>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, i) => (
            <div key={product.name} className="animate-on-scroll group" style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="glass-hover rounded-2xl overflow-hidden card-3d">
                <div className="relative overflow-hidden">
                  <img src={product.image} alt={product.name} className="w-full h-80 object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <span className="absolute top-4 left-4 bg-primary/90 text-primary-foreground text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
                    {product.tag}
                  </span>
                  <button className="absolute top-4 right-4 p-2 glass rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 text-foreground hover:text-primary">
                    <Heart size={16} />
                  </button>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-foreground">{product.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-primary font-bold">{product.price}<span className="text-muted-foreground text-xs font-normal"> {t("products.perDay")}</span></p>
                    <button className="text-xs glass px-3 py-1.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                      {t("products.rentNow")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
