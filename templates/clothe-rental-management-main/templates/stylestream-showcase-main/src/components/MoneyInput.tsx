import { cn } from '@/lib/utils';

interface MoneyInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
}

export function MoneyInput({ value, onChange, className, placeholder = '0' }: MoneyInputProps) {
  const formatted = value ? new Intl.NumberFormat('vi-VN').format(value) : '';

  return (
    <div className={cn('relative', className)}>
      <input
        type="text"
        value={formatted}
        onChange={e => {
          const num = parseInt(e.target.value.replace(/\D/g, ''), 10);
          onChange(isNaN(num) ? 0 : num);
        }}
        placeholder={placeholder}
        className="w-full px-3 py-2 pr-12 bg-accent rounded-lg text-sm text-foreground border-0 outline-none focus:ring-2 focus:ring-ring"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">VNĐ</span>
    </div>
  );
}
