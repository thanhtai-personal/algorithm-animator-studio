import { Link } from 'react-router-dom';
import { Product } from '@/data/types';
import { formatVND } from '@/data/mock';
import { ShortlistButton } from '@/components/ShortlistButton';

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 animate-slide-up">
      <Link to={`/showroom/${product.id}`} className="block">
        <div className="aspect-[3/4] relative overflow-hidden" style={{ background: product.gradient }}>
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute bottom-3 left-3 flex gap-1.5">
            {product.sizes.slice(0, 3).map(s => (
              <span key={s} className="px-2 py-0.5 text-[10px] font-medium bg-card/80 backdrop-blur-sm text-card-foreground rounded-md">{s}</span>
            ))}
          </div>
        </div>
      </Link>
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground mb-0.5">{product.category}</p>
            <Link to={`/showroom/${product.id}`}>
              <h3 className="font-semibold text-sm text-foreground truncate hover:text-primary transition-colors">{product.name}</h3>
            </Link>
          </div>
          <ShortlistButton productId={product.id} />
        </div>
        <p className="text-sm font-bold text-primary mt-2">{formatVND(product.price)}<span className="text-xs font-normal text-muted-foreground">/ngày</span></p>
      </div>
    </div>
  );
}
