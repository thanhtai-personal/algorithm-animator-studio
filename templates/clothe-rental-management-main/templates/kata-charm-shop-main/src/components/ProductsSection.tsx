import { Heart, ArrowRight } from "lucide-react";
import { useState } from "react";
import product1 from "@/assets/product1.jpg";
import product2 from "@/assets/product2.jpg";
import product3 from "@/assets/product3.jpg";
import product4 from "@/assets/product4.jpg";
import product5 from "@/assets/product5.jpg";
import product6 from "@/assets/product6.jpg";

const products = [
  { id: 1, name: "Áo Dài Hồng Pastel", price: "350,000₫", tag: "Mới", image: product1 },
  { id: 2, name: "Vest Xanh Navy", price: "500,000₫", tag: "Hot", image: product2 },
  { id: 3, name: "Đầm Dạ Hội Đỏ", price: "600,000₫", tag: "Sang trọng", image: product3 },
  { id: 4, name: "Áo Dài Tím Lavender", price: "380,000₫", tag: "Dễ thương", image: product4 },
  { id: 5, name: "Váy Cưới Trắng Vàng", price: "800,000₫", tag: "Premium", image: product5 },
  { id: 6, name: "Đầm Xanh Ngọc", price: "450,000₫", tag: "Mới", image: product6 },
];

const ProductCard = ({ product }: { product: typeof products[0] }) => {
  const [liked, setLiked] = useState(false);

  return (
    <div className="group bg-card rounded-2xl overflow-hidden shadow-cute hover-lift border border-border">
      <div className="relative overflow-hidden aspect-[4/5]">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          width={512}
          height={640}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {/* Tag */}
        <span className="absolute top-3 left-3 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
          {product.tag}
        </span>
        {/* Like */}
        <button
          onClick={() => setLiked(!liked)}
          className="absolute top-3 right-3 w-9 h-9 bg-card/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:scale-110 transition-all"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${liked ? "fill-primary text-primary" : "text-muted-foreground"}`}
          />
        </button>
        {/* Quick action */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
            Thuê ngay 💖
          </button>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-foreground text-sm mb-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <p className="text-primary font-bold">{product.price}</p>
      </div>
    </div>
  );
};

const ProductsSection = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Sản phẩm nổi bật ✨
            </h2>
            <p className="text-muted-foreground mt-2">Những trang phục được yêu thích nhất</p>
          </div>
          <button className="hidden sm:flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all">
            Xem thêm <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
