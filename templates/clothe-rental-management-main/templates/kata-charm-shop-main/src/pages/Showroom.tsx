import { useState } from "react";
import { Search, SlidersHorizontal, Heart, ShoppingBag, Star, X } from "lucide-react";
import ShopHeader from "@/components/ShopHeader";
import ShopFooter from "@/components/ShopFooter";
import product1 from "@/assets/product1.jpg";
import product2 from "@/assets/product2.jpg";
import product3 from "@/assets/product3.jpg";
import product4 from "@/assets/product4.jpg";
import product5 from "@/assets/product5.jpg";
import product6 from "@/assets/product6.jpg";

const allProducts = [
  { id: 1, name: "Áo dài hồng pastel", price: "350.000đ", category: "Áo dài", gender: "Nữ", size: "S", rating: 4.8, image: product1 },
  { id: 2, name: "Vest cổ điển nam", price: "500.000đ", category: "Vest", gender: "Nam", size: "M", rating: 4.9, image: product2 },
  { id: 3, name: "Đầm dạ hội tím", price: "600.000đ", category: "Đầm dạ hội", gender: "Nữ", size: "M", rating: 4.7, image: product3 },
  { id: 4, name: "Áo dài cưới đỏ", price: "450.000đ", category: "Áo dài", gender: "Nữ", size: "S", rating: 5.0, image: product4 },
  { id: 5, name: "Suit modern xanh", price: "550.000đ", category: "Vest", gender: "Nam", size: "L", rating: 4.6, image: product5 },
  { id: 6, name: "Đầm công chúa", price: "700.000đ", category: "Đầm dạ hội", gender: "Nữ", size: "M", rating: 4.9, image: product6 },
  { id: 7, name: "Áo dài trắng tinh khôi", price: "380.000đ", category: "Áo dài", gender: "Nữ", size: "M", rating: 4.8, image: product1 },
  { id: 8, name: "Vest slim fit đen", price: "520.000đ", category: "Vest", gender: "Nam", size: "L", rating: 4.7, image: product2 },
];

const categories = ["Tất cả", "Áo dài", "Vest", "Đầm dạ hội"];
const genders = ["Tất cả", "Nữ", "Nam", "Unisex"];
const sizes = ["Tất cả", "S", "M", "L", "XL"];

const Showroom = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [selectedGender, setSelectedGender] = useState("Tất cả");
  const [selectedSize, setSelectedSize] = useState("Tất cả");
  const [showFilters, setShowFilters] = useState(true);
  const [likedProducts, setLikedProducts] = useState<number[]>([]);

  const filtered = allProducts.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedCategory !== "Tất cả" && p.category !== selectedCategory) return false;
    if (selectedGender !== "Tất cả" && p.gender !== selectedGender) return false;
    if (selectedSize !== "Tất cả" && p.size !== selectedSize) return false;
    return true;
  });

  const toggleLike = (id: number) => {
    setLikedProducts((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("Tất cả");
    setSelectedGender("Tất cả");
    setSelectedSize("Tất cả");
  };

  return (
    <div className="min-h-screen bg-background">
      <ShopHeader />

      {/* Hero Banner */}
      <div className="gradient-cute py-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 bg-primary-foreground rounded-full animate-float"
              style={{ left: `${15 + i * 15}%`, top: `${20 + (i % 3) * 25}%`, animationDelay: `${i * 0.5}s` }}
            />
          ))}
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-2 animate-slide-up">
          Phòng trưng bày
        </h1>
        <p className="text-accent-script text-3xl text-primary-foreground/80 animate-slide-up-delay-1">
          cho thuê
        </p>
        <p className="text-primary-foreground/70 mt-4 animate-slide-up-delay-2">
          Chọn trước trang phục bạn muốn thử trước khi đến cửa hàng.
        </p>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground text-sm">{filtered.length} sản phẩm</p>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted hover:bg-primary/10 transition-colors text-sm font-medium"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {showFilters ? "Ẩn bộ lọc" : "Mở bộ lọc"}
          </button>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-72 shrink-0 hidden md:block animate-slide-up">
              <div className="bg-card rounded-2xl p-6 shadow-card sticky top-24 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">Bộ lọc</h3>
                  <button onClick={clearFilters} className="text-xs text-primary hover:underline">Xóa bộ lọc</button>
                </div>

                {/* Search */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tìm theo tên</label>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Nhập tên sản phẩm..."
                      className="w-full pl-10 pr-4 py-2.5 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Danh mục</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {categories.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedCategory(c)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          selectedCategory === c
                            ? "bg-primary text-primary-foreground scale-105"
                            : "bg-muted hover:bg-primary/10 text-muted-foreground"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Giới tính</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {genders.map((g) => (
                      <button
                        key={g}
                        onClick={() => setSelectedGender(g)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          selectedGender === g
                            ? "bg-primary text-primary-foreground scale-105"
                            : "bg-muted hover:bg-primary/10 text-muted-foreground"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Size</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSize(s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          selectedSize === s
                            ? "bg-primary text-primary-foreground scale-105"
                            : "bg-muted hover:bg-primary/10 text-muted-foreground"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Product Grid */}
          <div className="flex-1">
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-5xl mb-4">🔍</p>
                <p className="text-lg font-semibold text-foreground">Không tìm thấy sản phẩm</p>
                <p className="text-muted-foreground mt-2">Thử thay đổi bộ lọc để xem thêm sản phẩm.</p>
                <button onClick={clearFilters} className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:scale-105 transition-transform">
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((product, i) => (
                  <div
                    key={product.id}
                    className="group bg-card rounded-2xl overflow-hidden shadow-card hover-lift animate-slide-up"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <button
                        onClick={() => toggleLike(product.id)}
                        className="absolute top-3 right-3 p-2 bg-card/80 backdrop-blur-sm rounded-full hover:scale-110 transition-transform"
                      >
                        <Heart
                          className={`w-4 h-4 transition-colors ${
                            likedProducts.includes(product.id) ? "fill-primary text-primary" : "text-muted-foreground"
                          }`}
                        />
                      </button>
                      <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                        <button className="flex-1 flex items-center justify-center gap-1 py-2 bg-primary text-primary-foreground rounded-full text-xs font-semibold hover:scale-105 transition-transform">
                          <ShoppingBag className="w-3 h-3" />
                          Thêm vào giỏ
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-1 mb-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-muted-foreground">{product.rating}</span>
                        <span className="text-xs text-muted-foreground ml-auto px-2 py-0.5 bg-muted rounded-full">{product.gender}</span>
                      </div>
                      <h3 className="font-semibold text-sm">{product.name}</h3>
                      <p className="text-primary font-bold mt-1">{product.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ShopFooter />
    </div>
  );
};

export default Showroom;
