import { payments, formatVND } from '@/data/mock';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const typeLabel: Record<string, string> = { DEPOSIT: 'Đặt cọc', RENTAL: 'Thuê', REFUND: 'Hoàn', PENALTY: 'Phạt' };
const methodLabel: Record<string, string> = { CASH: 'Tiền mặt', TRANSFER: 'Chuyển khoản', CARD: 'Thẻ' };

export default function Payments() {
  const total = payments.reduce((sum, p) => sum + (p.type === 'REFUND' ? -p.amount : p.amount), 0);

  const exportCSV = () => {
    toast({ title: 'Xuất CSV', description: 'Đã tải xuống file payments.csv (mock)' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Thanh toán</h1>
          <p className="text-sm text-muted-foreground">Tổng: {formatVND(total)}</p>
        </div>
        <Button variant="outline" className="rounded-xl gap-2" onClick={exportCSV}><Download className="w-4 h-4" /> Xuất CSV</Button>
      </div>

      <DataTable
        columns={[
          { key: 'id', label: 'Mã', render: r => <span className="font-mono text-xs">{r.id}</span> },
          { key: 'orderId', label: 'Đơn hàng', render: r => <span className="font-mono text-xs">{r.orderId}</span> },
          { key: 'customerName', label: 'Khách hàng' },
          { key: 'type', label: 'Loại', render: r => <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.type === 'REFUND' ? 'bg-destructive/15 text-destructive' : 'bg-success/15 text-success'}`}>{typeLabel[r.type]}</span> },
          { key: 'amount', label: 'Số tiền', render: r => <span className={`font-medium ${r.type === 'REFUND' ? 'text-destructive' : 'text-foreground'}`}>{r.type === 'REFUND' ? '-' : ''}{formatVND(r.amount)}</span> },
          { key: 'method', label: 'Phương thức', render: r => methodLabel[r.method] },
          { key: 'date', label: 'Ngày' },
          { key: 'note', label: 'Ghi chú', render: r => <span className="text-muted-foreground">{r.note}</span> },
        ]}
        data={payments}
      />
    </div>
  );
}
