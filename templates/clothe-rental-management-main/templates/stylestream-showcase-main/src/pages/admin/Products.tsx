import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { products, formatVND } from '@/data/mock';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function Products() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sản phẩm</h1>
          <p className="text-sm text-muted-foreground">{products.length} sản phẩm</p>
        </div>
        <Button className="rounded-xl gap-2"><Plus className="w-4 h-4" /> Thêm sản phẩm</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm sản phẩm..." className="w-full pl-9 pr-4 py-2 bg-accent rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring border-0" />
      </div>

      <DataTable
        columns={[
          { key: 'preview', label: '', render: (r) => <div className="w-10 h-10 rounded-lg" style={{ background: r.gradient }} />, className: 'w-14' },
          { key: 'name', label: 'Tên sản phẩm', render: (r) => <span className="font-medium">{r.name}</span> },
          { key: 'category', label: 'Danh mục' },
          { key: 'price', label: 'Giá/ngày', render: (r) => formatVND(r.price) },
          { key: 'sizes', label: 'Size', render: (r) => r.sizes.join(', ') },
          { key: 'tags', label: 'Tags', render: (r) => <div className="flex gap-1 flex-wrap">{r.tags.slice(0,2).map((t: string) => <span key={t} className="px-2 py-0.5 bg-accent text-accent-foreground rounded-md text-xs">{t}</span>)}</div> },
        ]}
        data={filtered}
        onRowClick={(r) => navigate(`/admin/products/${r.id}`)}
      />
    </div>
  );
}
