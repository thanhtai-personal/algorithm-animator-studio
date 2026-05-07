import { useNavigate } from 'react-router-dom';
import { orders, formatVND } from '@/data/mock';
import { StatusChip } from '@/components/StatusChip';
import { DataTable } from '@/components/DataTable';

export default function Orders() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Đơn hàng</h1>
        <p className="text-sm text-muted-foreground">{orders.length} đơn</p>
      </div>

      <DataTable
        columns={[
          { key: 'id', label: 'Mã đơn', render: r => <span className="font-mono text-xs">{r.id}</span> },
          { key: 'customerName', label: 'Khách hàng', render: r => <span className="font-medium">{r.customerName}</span> },
          { key: 'status', label: 'Trạng thái', render: r => <StatusChip status={r.status} /> },
          { key: 'items', label: 'Sản phẩm', render: r => r.items.map((i: any) => i.productName).join(', ') },
          { key: 'totalAmount', label: 'Tổng', render: r => <span className="font-medium">{formatVND(r.totalAmount)}</span> },
          { key: 'rentalStart', label: 'Thuê từ' },
          { key: 'rentalEnd', label: 'Đến' },
        ]}
        data={orders}
        onRowClick={r => navigate(`/admin/orders/${r.id}`)}
      />
    </div>
  );
}
