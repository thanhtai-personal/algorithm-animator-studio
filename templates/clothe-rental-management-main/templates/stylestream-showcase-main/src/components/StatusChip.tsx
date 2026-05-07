import { cn } from '@/lib/utils';

const config: Record<string, { cls: string; label: string }> = {
  READY:       { cls: 'bg-success/15 text-success', label: 'Sẵn sàng' },
  RESERVED:    { cls: 'bg-warning/15 text-warning', label: 'Đã đặt' },
  ON_RENT:     { cls: 'bg-primary/15 text-primary', label: 'Đang thuê' },
  LAUNDRY:     { cls: 'bg-secondary text-secondary-foreground', label: 'Giặt ủi' },
  MAINTENANCE: { cls: 'bg-warning/15 text-warning', label: 'Bảo trì' },
  DAMAGED:     { cls: 'bg-destructive/15 text-destructive', label: 'Hư hỏng' },
  LOST:        { cls: 'bg-muted text-muted-foreground', label: 'Thất lạc' },
  RETIRED:     { cls: 'bg-muted text-muted-foreground', label: 'Ngừng dùng' },
  DRAFT:       { cls: 'bg-muted text-muted-foreground', label: 'Nháp' },
  CONFIRMED:   { cls: 'bg-success/15 text-success', label: 'Xác nhận' },
  PICKED_UP:   { cls: 'bg-primary/15 text-primary', label: 'Đã lấy' },
  RETURNED:    { cls: 'bg-warning/15 text-warning', label: 'Đã trả' },
  COMPLETED:   { cls: 'bg-success/15 text-success', label: 'Hoàn thành' },
  CANCELLED:   { cls: 'bg-destructive/15 text-destructive', label: 'Đã hủy' },
};

export function StatusChip({ status, className }: { status: string; className?: string }) {
  const { cls, label } = config[status] || { cls: 'bg-muted text-muted-foreground', label: status };
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full', cls, className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
