import { useState, useMemo } from 'react';
import { products, inventoryItems, categories } from '@/data/mock';
import { StatusChip } from '@/components/StatusChip';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Package } from 'lucide-react';

export default function StockCheck() {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');

  const data = useMemo(() => {
    return products
      .filter(p => {
        const q = search.toLowerCase();
        const matchSearch = p.name.toLowerCase().includes(q) || p.id.includes(q);
        const matchCat = catFilter === 'all' || p.category === catFilter;
        return matchSearch && matchCat;
      })
      .map(p => {
        const items = inventoryItems.filter(i => i.productId === p.id);
        const ready = items.filter(i => i.status === 'READY').length;
        const total = items.length;
        return { product: p, items, ready, total };
      });
  }, [search, catFilter]);

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-6xl mx-auto">
      <h2 className="text-xl font-bold text-foreground">Tra cứu tồn kho</h2>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Tìm sản phẩm..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {data.map(({ product, items, ready, total }) => (
          <div key={product.id} className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" style={{ background: product.gradient }}>
                <Package className="w-5 h-5 text-white/80" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{product.name}</p>
                <p className="text-xs text-muted-foreground">{product.category} · Sizes: {product.sizes.join(', ')}</p>
              </div>
              <div className="text-right shrink-0">
                <Badge variant={ready > 0 ? 'secondary' : 'destructive'}>
                  {ready}/{total} sẵn
                </Badge>
              </div>
            </div>
            {items.length > 0 && (
              <div className="border-t border-border bg-accent/30">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground">
                      <th className="text-left px-4 py-2 font-medium">SKU</th>
                      <th className="text-left px-4 py-2 font-medium">Size</th>
                      <th className="text-left px-4 py-2 font-medium">Màu</th>
                      <th className="text-left px-4 py-2 font-medium">Trạng thái</th>
                      <th className="text-left px-4 py-2 font-medium">Tình trạng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id} className="border-t border-border/50">
                        <td className="px-4 py-2 text-foreground font-mono text-xs">{item.sku}</td>
                        <td className="px-4 py-2 text-foreground">{item.size}</td>
                        <td className="px-4 py-2 text-foreground">{item.color}</td>
                        <td className="px-4 py-2"><StatusChip status={item.status} /></td>
                        <td className="px-4 py-2 text-muted-foreground">{item.condition}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
