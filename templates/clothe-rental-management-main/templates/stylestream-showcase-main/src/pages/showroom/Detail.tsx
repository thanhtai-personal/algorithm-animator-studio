import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { products, formatVND } from '@/data/mock';
import { ShortlistButton } from '@/components/ShortlistButton';
import { Button } from '@/components/ui/button';
import { useShortlist } from '@/contexts/ShortlistContext';

export default function ShowroomDetail() {
  const { productId } = useParams();
  const product = products.find(p => p.id === productId);
  const { toggle, has } = useShortlist();

  if (!product) return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-muted-foreground">Sản phẩm không tồn tại</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <Link to="/showroom" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="w-4 h-4" /> Quay lại
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="aspect-[3/4] rounded-2xl overflow-hidden" style={{ background: product.gradient }} />
          <div className="grid grid-cols-4 gap-2">
            {[0.8, 0.6, 0.9, 0.7].map((opacity, i) => (
              <div key={i} className="aspect-square rounded-xl cursor-pointer hover:ring-2 hover:ring-primary transition-all" style={{ background: product.gradient, opacity }} />
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{product.category}</p>
            <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">{formatVND(product.price)}</span>
            <span className="text-muted-foreground">/ ngày</span>
          </div>

          <p className="text-foreground leading-relaxed">{product.description}</p>

          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Kích thước</p>
            <div className="flex gap-2">
              {product.sizes.map(s => (
                <button key={s} className="px-4 py-2 border border-border rounded-xl text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors">{s}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Màu sắc</p>
            <div className="flex gap-2">
              {product.colors.map(c => (
                <span key={c} className="px-3 py-1.5 bg-accent rounded-lg text-sm text-foreground">{c}</span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Tags</p>
            <div className="flex gap-2 flex-wrap">
              {product.tags.map(t => (
                <span key={t} className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">{t}</span>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              className="flex-1 rounded-xl h-12 text-base"
              onClick={() => toggle(product.id)}
            >
              {has(product.id) ? '✓ Đã thêm vào Shortlist' : '♡ Thêm vào Shortlist'}
            </Button>
            <ShortlistButton productId={product.id} size="lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
