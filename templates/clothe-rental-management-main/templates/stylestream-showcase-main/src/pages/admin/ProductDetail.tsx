import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { products, inventoryItems, formatVND } from '@/data/mock';
import { StatusChip } from '@/components/StatusChip';
import { DataTable } from '@/components/DataTable';
import { UploadDropzone } from '@/components/UploadDropzone';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

export default function ProductDetail() {
  const { id } = useParams();
  const product = products.find(p => p.id === id);
  if (!product) return <div className="text-center py-12 text-muted-foreground">Sản phẩm không tồn tại</div>;

  const items = inventoryItems.filter(i => i.productId === product.id);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to="/admin/products" className="p-2 rounded-lg hover:bg-accent text-muted-foreground"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
          <p className="text-sm text-muted-foreground">{product.category} · {formatVND(product.price)}/ngày</p>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="bg-muted rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg">Tổng quan</TabsTrigger>
          <TabsTrigger value="items" className="rounded-lg">Items ({items.length})</TabsTrigger>
          <TabsTrigger value="media" className="rounded-lg">Hình ảnh</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl aspect-square" style={{ background: product.gradient }} />
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Mô tả</label>
                <p className="text-foreground mt-1">{product.description}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Kích thước</label>
                <div className="flex gap-2 mt-1">{product.sizes.map(s => <span key={s} className="px-3 py-1 bg-accent rounded-lg text-sm text-foreground">{s}</span>)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Màu sắc</label>
                <div className="flex gap-2 mt-1">{product.colors.map(c => <span key={c} className="px-3 py-1 bg-accent rounded-lg text-sm text-foreground">{c}</span>)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tags</label>
                <div className="flex gap-2 mt-1 flex-wrap">{product.tags.map(t => <span key={t} className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">{t}</span>)}</div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="items" className="mt-4">
          <DataTable
            columns={[
              { key: 'sku', label: 'SKU', render: r => <span className="font-mono text-xs">{r.sku}</span> },
              { key: 'size', label: 'Size' },
              { key: 'color', label: 'Màu' },
              { key: 'status', label: 'Trạng thái', render: r => <StatusChip status={r.status} /> },
              { key: 'condition', label: 'Tình trạng' },
            ]}
            data={items}
          />
        </TabsContent>

        <TabsContent value="media" className="mt-4 space-y-4">
          <UploadDropzone onFiles={files => console.log('Mock upload:', files)} />
          <p className="text-sm text-muted-foreground text-center">Chưa có hình ảnh nào được tải lên (UI demo)</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
