import { ArrowRight } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import product1 from "@/assets/product1.jpg";
import product2 from "@/assets/product2.jpg";
import product3 from "@/assets/product3.jpg";
import product4 from "@/assets/product4.jpg";

const products = [
  { img: product1, name: "Áo dài đỏ truyền thống", price: "350,000đ", tag: "Hot" },
  { img: product2, name: "Vest xanh navy lịch lãm", price: "400,000đ", tag: "Mới" },
  { img: product3, name: "Đầm dạ hội vàng champagne", price: "500,000đ", tag: null },
  { img: product4, name: "Áo dài trắng thêu hoa", price: "380,000đ", tag: "Yêu thích" },
];

const ProductsSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section id="products" ref={ref} className="py-24">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-primary text-sm font-semibold tracking-wider uppercase">Bộ sưu tập</span>
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-foreground mt-2">
              Sản phẩm nổi bật
            </h2>
          </div>
          <a href="#" className="hidden sm:flex items-center gap-2 text-sm font-medium text-primary hover:gap-3 transition-all duration-300">
            Xem thêm <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, i) => (
            <div
              key={product.name}
              className={`group cursor-pointer transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 0.15}s` }}
            >
              <div className="product-card-img relative aspect-[3/4] mb-4 bg-secondary rounded-2xl">
                <img
                  src={product.img}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-2xl"
                  loading="lazy"
                  width={640}
                  height={800}
                />
                {product.tag && (
                  <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    {product.tag}
                  </span>
                )}
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-500 rounded-2xl" />
              </div>
              <h3 className="font-medium text-foreground group-hover:text-primary transition-colors duration-300">{product.name}</h3>
              <p className="text-primary font-semibold mt-1">{product.price}</p>
            </div>
          ))}
        </div>

        <a href="#" className="sm:hidden flex items-center justify-center gap-2 mt-8 text-sm font-medium text-primary">
          Xem thêm <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </section>
  );
};

export default ProductsSection;
