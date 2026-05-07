import { useNavigate } from 'react-router-dom';
import { TrendingUp, ShoppingBag, Package, Users, AlertCircle } from 'lucide-react';
import { dashboardStats, orders, formatVND } from '@/data/mock';
import { StatusChip } from '@/components/StatusChip';
import { DataTable } from '@/components/DataTable';

const kpis = [
  { label: 'Doanh thu tháng', value: formatVND(dashboardStats.revenue), change: `+${dashboardStats.revenueChange}%`, icon: TrendingUp, positive: true },
  { label: 'Đơn đang xử lý', value: dashboardStats.activeOrders, change: '3 đơn mới', icon: ShoppingBag, positive: true },
  { label: 'Items sẵn sàng', value: dashboardStats.availableItems, change: '/ 14 tổng', icon: Package, positive: true },
  { label: 'Khách hàng', value: dashboardStats.totalCustomers, change: '+2 tháng này', icon: Users, positive: true },
];

const alerts = [
  { type: 'warning', msg: 'Đơn #o1 cần trả hôm nay' },
  { type: 'error', msg: 'Item i10 bị hư hỏng cần xử lý' },
  { type: 'info', msg: '2 items đang giặt ủi' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const dueToday = orders.filter(o => o.rentalEnd === '2026-02-28');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Tổng quan hoạt động kinh doanh</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{kpi.label}</span>
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <kpi.icon className="w-4.5 h-4.5 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            <p className="text-xs text-success mt-1">{kpi.change}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Due Today */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-foreground mb-3">Đơn cần trả hôm nay</h2>
          <DataTable
            columns={[
              { key: 'id', label: 'Mã đơn', render: (r) => <span className="font-mono text-xs">{r.id}</span> },
              { key: 'customerName', label: 'Khách hàng' },
              { key: 'status', label: 'Trạng thái', render: (r) => <StatusChip status={r.status} /> },
              { key: 'totalAmount', label: 'Tổng', render: (r) => <span className="font-medium">{formatVND(r.totalAmount)}</span> },
            ]}
            data={dueToday.length > 0 ? dueToday : orders.slice(0, 3)}
            onRowClick={(r) => navigate(`/admin/orders/${r.id}`)}
            emptyMessage="Không có đơn cần trả hôm nay"
          />
        </div>

        {/* Alerts */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Cảnh báo</h2>
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card">
                <AlertCircle className={`w-4 h-4 mt-0.5 shrink-0 ${a.type === 'error' ? 'text-destructive' : a.type === 'warning' ? 'text-warning' : 'text-primary'}`} />
                <span className="text-sm text-foreground">{a.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
