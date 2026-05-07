import { Heart } from 'lucide-react';
import { useShortlist } from '@/contexts/ShortlistContext';
import { cn } from '@/lib/utils';

export function ShortlistButton({ productId, size = 'sm' }: { productId: string; size?: 'sm' | 'lg' }) {
  const { toggle, has } = useShortlist();
  const active = has(productId);
  const iconSize = size === 'lg' ? 'w-6 h-6' : 'w-4 h-4';

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(productId); }}
      className={cn(
        'p-1.5 rounded-lg transition-all',
        active ? 'text-primary' : 'text-muted-foreground hover:text-primary'
      )}
    >
      <Heart className={cn(iconSize, active && 'fill-primary')} />
    </button>
  );
}
