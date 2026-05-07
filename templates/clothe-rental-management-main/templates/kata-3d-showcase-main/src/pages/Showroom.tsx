import { useState } from "react";
import { Search, SlidersHorizontal, Heart, Eye } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useLanguage } from "@/contexts/LanguageContext";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";

const Showroom = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [gender, setGender] = useState("all");
  const [size, setSize] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const sectionRef = useScrollAnimation();
  const { t, lang } = useLanguage();

  const allProducts = [
    { id: 1, name: lang === "vi" ? "Đầm Dạ Hội Đỏ" : "Red Evening Gown", price: lang === "vi" ? "450.000đ" : "$22", image: product1, category: "dam", gender: "nu", size: "M", tag: "Hot" },
    { id: 2, name: lang === "vi" ? "Vest Nam Xanh Navy" : "Navy Blue Suit", price: lang === "vi" ? "350.000đ" : "$17", image: product2, category: "vest", gender: "nam", size: "L", tag: lang === "vi" ? "Mới" : "New" },
    { id: 3, name: lang === "vi" ? "Áo Dài Cưới Trắng" : "White Wedding Ao Dai", price: lang === "vi" ? "600.000đ" : "$30", image: product3, category: "aodai", gender: "nu", size: "S", tag: "Premium" },
    { id: 4, name: lang === "vi" ? "Đầm Cocktail Xanh" : "Blue Cocktail Dress", price: lang === "vi" ? "380.000đ" : "$19", image: product4, category: "dam", gender: "nu", size: "M", tag: lang === "vi" ? "Phổ biến" : "Popular" },
    { id: 5, name: lang === "vi" ? "Áo Dài Nam Xanh" : "Blue Men's Ao Dai", price: lang === "vi" ? "400.000đ" : "$20", image: product1, category: "aodai", gender: "nam", size: "L", tag: lang === "vi" ? "Mới" : "New" },
    { id: 6, name: lang === "vi" ? "Đầm Dạ Hội Vàng" : "Gold Evening Gown", price: lang === "vi" ? "550.000đ" : "$27", image: product3, category: "dam", gender: "nu", size: "M", tag: "Premium" },
    { id: 7, name: lang === "vi" ? "Vest Trắng Classic" : "Classic White Suit", price: lang === "vi" ? "320.000đ" : "$16", image: product2, category: "vest", gender: "nam", size: "XL", tag: "Hot" },
    { id: 8, name: lang === "vi" ? "Áo Dài Đỏ Truyền Thống" : "Traditional Red Ao Dai", price: lang === "vi" ? "480.000đ" : "$24", image: product4, category: "aodai", gender: "nu", size: "S", tag: lang === "vi" ? "Phổ biến" : "Popular" },
  ];

  const categories = [
    { id: "all", label: t("showroom.all") },
    { id: "aodai", label: lang === "vi" ? "Áo dài" : "Ao Dai" },
    { id: "vest", label: "Vest" },
    { id: "dam", label: lang === "vi" ? "Đầm dạ hội" : "Evening Gowns" },
  ];

  const genders = [
    { id: "all", label: t("showroom.all") },
    { id: "nu", label: t("showroom.female") },
    { id: "nam", label: t("showroom.male") },
    { id: "unisex", label: "Unisex" },
  ];

  const sizes = [
    { id: "all", label: t("showroom.all") },
    { id: "S", label: "S" },
    { id: "M", label: "M" },
    { id: "L", label: "L" },
    { id: "XL", label: "XL" },
  ];

  const filtered = allProducts.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (category !== "all" && p.category !== category) return false;
    if (gender !== "all" && p.gender !== gender) return false;
    if (size !== "all" && p.size !== size) return false;
    return true;
  });

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setGender("all");
    setSize("all");
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="relative pt-24 pb-16 overflow-hidden grain">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-fade-in">
            {t("showroom.title")}
            <br />
            <span className="text-gradient">{t("showroom.titleAccent")}</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto animate-fade-in" style={{ animationDelay: "0.1s" }}>
            {t("showroom.desc")}
          </p>
        </div>
      </section>

      <section ref={sectionRef} className="pb-24">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">{filtered.length} {t("showroom.products")}</p>
            <button onClick={() => setFiltersOpen(!filtersOpen)} className="flex items-center gap-2 text-sm glass px-4 py-2 rounded-full hover:bg-secondary/80 transition-all">
              <SlidersHorizontal size={14} />
              {filtersOpen ? t("showroom.hideFilter") : t("showroom.showFilter")}
            </button>
          </div>

          <div className="flex gap-8">
            <div className={`transition-all duration-500 overflow-hidden ${filtersOpen ? "w-72 min-w-[288px] opacity-100" : "w-0 min-w-0 opacity-0"}`}>
              <div className="glass rounded-2xl p-6 space-y-6 sticky top-24">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{t("showroom.searchName")}</label>
                  <div className="relative mt-2">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder={t("showroom.searchPlaceholder")}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-secondary/50 border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{t("showroom.category")}</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {categories.map((c) => (
                      <button key={c.id} onClick={() => setCategory(c.id)} className={`px-3 py-1.5 rounded-full text-xs transition-all duration-300 ${category === c.id ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{t("showroom.gender")}</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {genders.map((g) => (
                      <button key={g.id} onClick={() => setGender(g.id)} className={`px-3 py-1.5 rounded-full text-xs transition-all duration-300 ${gender === g.id ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{t("showroom.size")}</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {sizes.map((s) => (
                      <button key={s.id} onClick={() => setSize(s.id)} className={`px-3 py-1.5 rounded-full text-xs transition-all duration-300 ${size === s.id ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={clearFilters} className="w-full py-2.5 text-sm text-muted-foreground border border-border/50 rounded-lg hover:text-foreground hover:border-border transition-all">
                  {t("showroom.clearFilter")}
                </button>
              </div>
            </div>

            <div className="flex-1">
              {filtered.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground text-lg">{t("showroom.noProducts")}</p>
                  <button onClick={clearFilters} className="mt-4 text-primary text-sm hover:underline">{t("showroom.clearFilter")}</button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filtered.map((product, i) => (
                    <div key={product.id} className="animate-on-scroll group" style={{ transitionDelay: `${i * 80}ms` }}>
                      <div className="glass-hover rounded-2xl overflow-hidden card-3d">
                        <div className="relative overflow-hidden">
                          <img src={product.image} alt={product.name} className="w-full h-72 object-cover transition-transform duration-700 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <span className="absolute top-4 left-4 bg-primary/90 text-primary-foreground text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">{product.tag}</span>
                          <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <button className="p-2 glass rounded-full hover:scale-110 text-foreground hover:text-primary transition-all"><Heart size={14} /></button>
                            <button className="p-2 glass rounded-full hover:scale-110 text-foreground hover:text-primary transition-all"><Eye size={14} /></button>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                            <button className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.5)] transition-all">
                              {t("showroom.addToCart")}
                            </button>
                          </div>
                        </div>
                        <div className="p-5">
                          <h3 className="font-semibold text-foreground">{product.name}</h3>
                          <p className="text-primary font-bold mt-1">
                            {product.price}
                            <span className="text-muted-foreground text-xs font-normal"> {t("products.perDay")}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Showroom;
