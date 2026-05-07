import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { products, formatVND } from '@/data/mock';

const revenueData = [
  { month: 'T9', revenue: 28000000 },
  { month: 'T10', revenue: 35000000 },
  { month: 'T11', revenue: 31000000 },
  { month: 'T12', revenue: 42000000 },
  { month: 'T1', revenue: 38000000 },
  { month: 'T2', revenue: 42500000 },
];

const topProducts = products.slice(0, 5).map((p, i) => ({
  name: p.name,
  rentals: [18, 15, 12, 10, 8][i],
}));

const utilizationData = [
  { name: 'Đang thuê', value: 3 },
  { name: 'Sẵn sàng', value: 7 },
  { name: 'Bảo trì', value: 2 },
  { name: 'Khác', value: 2 },
];

export default function Reports() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Báo cáo</h1>
        <p className="text-sm text-muted-foreground">Thống kê hoạt động kinh doanh</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-foreground mb-4">Doanh thu 6 tháng gần nhất</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={v => `${v/1000000}M`} />
              <Tooltip formatter={(v: number) => formatVND(v)} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Utilization */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-foreground mb-4">Tỷ lệ sử dụng kho</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={utilizationData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {utilizationData.map((_, i) => (
                  <Cell key={i} fill={['hsl(var(--primary))','hsl(var(--success))','hsl(var(--warning))','hsl(var(--muted-foreground))'][i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold text-foreground mb-4">Top sản phẩm được thuê</h3>
        <div className="space-y-3">
          {topProducts.map((p, i) => (
            <div key={p.name} className="flex items-center gap-3">
              <span className="text-sm font-bold text-muted-foreground w-6">#{i + 1}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{p.name}</span>
                  <span className="text-sm text-muted-foreground">{p.rentals} lần</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(p.rentals / 18) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
