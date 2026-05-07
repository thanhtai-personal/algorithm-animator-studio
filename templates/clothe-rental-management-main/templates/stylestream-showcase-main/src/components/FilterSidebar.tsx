import { useState } from 'react';
import { categories } from '@/data/mock';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FilterSidebarProps {
  selectedCategories: string[];
  onCategoriesChange: (cats: string[]) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  onClose?: () => void;
  className?: string;
}

export function FilterSidebar({ selectedCategories, onCategoriesChange, priceRange, onPriceRangeChange, onClose, className }: FilterSidebarProps) {
  const toggleCategory = (cat: string) => {
    onCategoriesChange(selectedCategories.includes(cat) ? selectedCategories.filter(c => c !== cat) : [...selectedCategories, cat]);
  };

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Bộ lọc</h3>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-accent rounded-lg text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-foreground mb-2">Danh mục</p>
        <div className="space-y-1">
          {categories.map(cat => (
            <label key={cat} className="flex items-center gap-2 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat)}
                onChange={() => toggleCategory(cat)}
                className="rounded border-border text-primary focus:ring-ring"
              />
              <span className="text-sm text-foreground">{cat}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-foreground mb-2">Giá thuê / ngày</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={priceRange[0]}
            onChange={e => onPriceRangeChange([+e.target.value, priceRange[1]])}
            className="w-full px-3 py-1.5 bg-accent rounded-lg text-sm text-foreground border-0 outline-none focus:ring-2 focus:ring-ring"
            placeholder="Từ"
          />
          <span className="text-muted-foreground">-</span>
          <input
            type="number"
            value={priceRange[1]}
            onChange={e => onPriceRangeChange([priceRange[0], +e.target.value])}
            className="w-full px-3 py-1.5 bg-accent rounded-lg text-sm text-foreground border-0 outline-none focus:ring-2 focus:ring-ring"
            placeholder="Đến"
          />
        </div>
      </div>

      <Button variant="outline" className="w-full" onClick={() => { onCategoriesChange([]); onPriceRangeChange([0, 10000000]); }}>
        Xóa bộ lọc
      </Button>
    </div>
  );
}
