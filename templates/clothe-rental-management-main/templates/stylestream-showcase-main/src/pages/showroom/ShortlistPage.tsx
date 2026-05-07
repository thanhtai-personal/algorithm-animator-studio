import { useShortlist } from '@/contexts/ShortlistContext';
import { products, formatVND } from '@/data/mock';
import { Link } from 'react-router-dom';
import { Trash2, Share2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

export default function ShortlistPage() {
  const { items, remove, updateNote } = useShortlist();

  const shortlistedProducts = items.map(item => ({
    ...item,
    product: products.find(p => p.id === item.productId)!,
  })).filter(i => i.product);

  const shareLink = () => {
    toast({ title: 'Link đã được copy!', description: 'https://rentafash.com/share/abc123 (mock)' });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      <Link to="/showroom" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="w-4 h-4" /> Quay lại Showroom
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Danh sách yêu thích</h1>
          <p className="text-sm text-muted-foreground">{items.length} sản phẩm</p>
        </div>
        {items.length > 0 && (
          <Button variant="outline" className="rounded-xl gap-2" onClick={shareLink}>
            <Share2 className="w-4 h-4" /> Chia sẻ
          </Button>
        )}
      </div>

      {shortlistedProducts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg font-medium text-muted-foreground mb-2">Chưa có sản phẩm nào</p>
          <p className="text-sm text-muted-foreground mb-4">Thêm sản phẩm yêu thích từ showroom</p>
          <Link to="/showroom"><Button className="rounded-xl">Khám phá Showroom</Button></Link>
        </div>
      ) : (
        <div className="space-y-4">
          {shortlistedProducts.map(({ product, note, productId }) => (
            <div key={productId} className="flex gap-4 p-4 rounded-xl border border-border bg-card">
              <Link to={`/showroom/${product.id}`} className="shrink-0">
                <div className="w-20 h-24 rounded-lg" style={{ background: product.gradient }} />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">{product.category}</p>
                    <Link to={`/showroom/${product.id}`} className="font-semibold text-foreground hover:text-primary transition-colors">{product.name}</Link>
                    <p className="text-sm font-bold text-primary mt-1">{formatVND(product.price)}/ngày</p>
                  </div>
                  <button onClick={() => remove(productId)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  value={note}
                  onChange={e => updateNote(productId, e.target.value)}
                  placeholder="Thêm ghi chú..."
                  className="mt-2 w-full text-sm bg-accent rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring resize-none border-0"
                  rows={2}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
