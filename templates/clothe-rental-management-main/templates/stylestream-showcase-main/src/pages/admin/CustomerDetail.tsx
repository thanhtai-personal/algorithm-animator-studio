import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, Ban } from 'lucide-react';
import { customers, orders, formatVND } from '@/data/mock';
import { StatusChip } from '@/components/StatusChip';
import { DataTable } from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';

export default function CustomerDetail() {
  const { id } = useParams();
  const customer = customers.find(c => c.id === id);
  if (!customer) return <div className="text-center py-12 text-muted-foreground">Khách hàng không tồn tại</div>;

  const customerOrders = orders.filter(o => o.customerId === customer.id);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to="/admin/customers" className="p-2 rounded-lg hover:bg-accent text-muted-foreground"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{customer.name}</h1>
            {customer.vip && <Badge className="bg-primary/15 text-primary border-0 gap-1"><Star className="w-3 h-3" />VIP</Badge>}
            {customer.blacklisted && <Badge variant="destructive" className="gap-1"><Ban className="w-3 h-3" />Blacklist</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{customer.email} · {customer.phone}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Tổng đơn hàng</p>
          <p className="text-2xl font-bold text-foreground mt-1">{customer.totalOrders}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Tổng chi tiêu</p>
          <p className="text-2xl font-bold text-foreground mt-1">{formatVND(customer.totalSpent)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Khách từ</p>
          <p className="text-2xl font-bold text-foreground mt-1">{customer.createdAt}</p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Lịch sử đơn hàng</h2>
        <DataTable
          columns={[
            { key: 'id', label: 'Mã đơn', render: r => <span className="font-mono text-xs">{r.id}</span> },
            { key: 'status', label: 'Trạng thái', render: r => <StatusChip status={r.status} /> },
            { key: 'totalAmount', label: 'Tổng', render: r => formatVND(r.totalAmount) },
            { key: 'rentalStart', label: 'Từ' },
            { key: 'rentalEnd', label: 'Đến' },
          ]}
          data={customerOrders}
          emptyMessage="Chưa có đơn hàng nào"
        />
      </div>
    </div>
  );
}
