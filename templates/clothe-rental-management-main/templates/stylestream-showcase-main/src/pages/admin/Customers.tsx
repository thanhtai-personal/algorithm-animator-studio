import { useNavigate } from 'react-router-dom';
import { customers, formatVND } from '@/data/mock';
import { DataTable } from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';

export default function Customers() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Khách hàng</h1>
        <p className="text-sm text-muted-foreground">{customers.length} khách hàng</p>
      </div>

      <DataTable
        columns={[
          { key: 'name', label: 'Tên', render: r => (
            <div className="flex items-center gap-2">
              <span className="font-medium">{r.name}</span>
              {r.vip && <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-primary/15 text-primary border-0">VIP</Badge>}
              {r.blacklisted && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Blacklist</Badge>}
            </div>
          )},
          { key: 'phone', label: 'SĐT' },
          { key: 'email', label: 'Email' },
          { key: 'totalOrders', label: 'Đơn hàng' },
          { key: 'totalSpent', label: 'Tổng chi', render: r => formatVND(r.totalSpent) },
          { key: 'createdAt', label: 'Ngày tạo' },
        ]}
        data={customers}
        onRowClick={r => navigate(`/admin/customers/${r.id}`)}
      />
    </div>
  );
}
