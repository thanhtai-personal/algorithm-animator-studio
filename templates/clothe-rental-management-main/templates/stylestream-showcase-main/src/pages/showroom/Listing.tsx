import { useState } from 'react';
import { products } from '@/data/mock';
import { ProductCard } from '@/components/ProductCard';
import { FilterSidebar } from '@/components/FilterSidebar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal } from 'lucide-react';

export default function Listing() {
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]);
  const [filterOpen, setFilterOpen] = useState(false);

  const filtered = products.filter(p => {
    if (selectedCats.length > 0 && !selectedCats.includes(p.category)) return false;
    if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
    return true;
  });

  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight">
            Thuê trang phục<br /><span className="text-primary">cho mọi dịp đặc biệt</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Bộ sưu tập áo dài, vest, đầm dạ hội cao cấp. Thuê dễ dàng, trả tiện lợi.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">{filtered.length} sản phẩm</p>
          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="rounded-xl gap-2 md:hidden"><SlidersHorizontal className="w-4 h-4" />Lọc</Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <FilterSidebar selectedCategories={selectedCats} onCategoriesChange={setSelectedCats} priceRange={priceRange} onPriceRangeChange={setPriceRange} onClose={() => setFilterOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex gap-8">
          {/* Desktop filter */}
          <div className="hidden md:block w-56 shrink-0">
            <FilterSidebar selectedCategories={selectedCats} onCategoriesChange={setSelectedCats} priceRange={priceRange} onPriceRangeChange={setPriceRange} />
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-16 text-muted-foreground">
                <p className="text-lg font-medium">Không tìm thấy sản phẩm</p>
                <p className="text-sm mt-1">Thử thay đổi bộ lọc</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
