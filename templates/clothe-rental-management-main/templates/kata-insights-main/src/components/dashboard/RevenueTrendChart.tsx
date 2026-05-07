import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { chartData, formatMoneyShort } from "@/data/mockData";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-2.5 shadow-lg">
        <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
        <p className="text-xs text-success">
          DT: {payload[0]?.value?.toLocaleString("vi-VN")} đ
        </p>
        <p className="text-xs text-kpi-profit">
          LN: {payload[1]?.value?.toLocaleString("vi-VN")} đ
        </p>
      </div>
    );
  }
  return null;
};

const RevenueTrendChart = () => {
  return (
    <div className="bg-card rounded-lg border border-border/60 p-3">
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-success" />
          <span className="text-[11px] text-muted-foreground">Doanh thu</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-kpi-profit" />
          <span className="text-[11px] text-muted-foreground">Lợi nhuận</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={chartData.daily} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(152, 55%, 42%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(152, 55%, 42%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(200, 65%, 48%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(200, 65%, 48%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(35, 20%, 90%)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(25, 10%, 50%)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "hsl(25, 10%, 50%)" }} axisLine={false} tickLine={false} tickFormatter={formatMoneyShort} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="revenue" stroke="hsl(152, 55%, 42%)" fill="url(#revGrad)" strokeWidth={2} />
          <Area type="monotone" dataKey="profit" stroke="hsl(200, 65%, 48%)" fill="url(#profitGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueTrendChart;
