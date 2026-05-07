import { useState } from "react";
import { Search, SlidersHorizontal, Grid3X3, LayoutList, Heart, ShoppingBag } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import product1 from "@/assets/product1.jpg";
import product2 from "@/assets/product2.jpg";
import product3 from "@/assets/product3.jpg";
import product4 from "@/assets/product4.jpg";

const categories = [
  "Tất cả", "Áo dài", "Vest nam", "Đầm dạ hội", "Áo cưới", "Phụ kiện"
];

const products = [
  { id: 1, name: "Áo Dài Hoa Sen", category: "Áo dài", price: "2.500.000₫", image: product1, tag: "Mới" },
  { id: 2, name: "Vest Luxury Classic", category: "Vest nam", price: "3.800.000₫", image: product2, tag: "Hot" },
  { id: 3, name: "Đầm Dạ Hội Ruby", category: "Đầm dạ hội", price: "4.200.000₫", image: product3 },
  { id: 4, name: "Áo Dài Cách Tân", category: "Áo dài", price: "2.800.000₫", image: product4, tag: "Mới" },
  { id: 5, name: "Vest Slim Fit Navy", category: "Vest nam", price: "3.500.000₫", image: product2 },
  { id: 6, name: "Đầm Cocktail Emerald", category: "Đầm dạ hội", price: "3.200.000₫", image: product3 },
  { id: 7, name: "Áo Dài Truyền Thống", category: "Áo dài", price: "2.200.000₫", image: product1 },
  { id: 8, name: "Áo Cưới Princess", category: "Áo cưới", price: "8.500.000₫", image: product4, tag: "Premium" },
];

const Showroom = () => {
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { ref: heroRef } = useScrollReveal();

  const filtered = products.filter((p) => {
    const matchCat = selectedCategory === "Tất cả" || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Banner */}
      <section className="pt-20 pb-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-foreground/90 to-foreground/70" />
        <div
          className="absolute inset-0 opacity-30"
          style={{ backgroundImage: `url(${product1})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div ref={heroRef} className="relative container mx-auto px-4 py-16 text-center">
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-primary-foreground mb-4 animate-fade-in">
            Phòng trưng bày
            <span className="block text-primary mt-2">cho thuê</span>
          </h1>
          <p className="text-primary-foreground/70 text-lg max-w-xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Chọn trước trang phục bạn muốn thử trước khi đến cửa hàng.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground text-sm">{filtered.length} sản phẩm</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutList className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-72 flex-shrink-0">
            <div className="glass-card p-6 sticky top-24 space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" /> Bộ lọc
                </h3>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tìm theo tên, chất liệu</label>
                <div className="mt-2 flex items-center gap-2 bg-secondary rounded-xl px-3 py-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nhập tên sản phẩm..."
                    className="bg-transparent w-full outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Danh mục</label>
                <div className="mt-2 flex flex-col gap-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-left px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                        selectedCategory === cat
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            <h2 className="font-serif text-xl font-semibold text-foreground mb-4">Danh sách sản phẩm</h2>
            {filtered.length === 0 ? (
              <div className="glass-card p-16 text-center">
                <h3 className="font-serif text-xl font-semibold mb-2">Không tìm thấy sản phẩm</h3>
                <p className="text-muted-foreground">Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.</p>
              </div>
            ) : (
              <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                {filtered.map((product, i) => (
                  <div
                    key={product.id}
                    className="glass-card overflow-hidden hover-lift group cursor-pointer animate-fade-in"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className={`relative ${viewMode === "list" ? "flex" : ""}`}>
                      <div className={`product-card-img ${viewMode === "list" ? "w-40 h-40 flex-shrink-0" : "aspect-[3/4]"}`}>
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      </div>

                      {/* Overlay actions */}
                      <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                        <button className="p-2 bg-background/90 backdrop-blur-sm rounded-full shadow-md hover:bg-primary hover:text-primary-foreground transition-colors">
                          <Heart className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-background/90 backdrop-blur-sm rounded-full shadow-md hover:bg-primary hover:text-primary-foreground transition-colors">
                          <ShoppingBag className="w-4 h-4" />
                        </button>
                      </div>

                      {product.tag && (
                        <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                          {product.tag}
                        </span>
                      )}

                      <div className={viewMode === "list" ? "flex-1 p-4 flex flex-col justify-center" : "p-4"}>
                        <p className="text-xs text-muted-foreground mb-1">{product.category}</p>
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{product.name}</h3>
                        <p className="text-primary font-bold mt-1">{product.price}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Showroom;
