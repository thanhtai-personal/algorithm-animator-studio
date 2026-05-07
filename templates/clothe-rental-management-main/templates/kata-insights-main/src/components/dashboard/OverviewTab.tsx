import { Activity, Wallet, Package, TrendingUp, AlertCircle, ArrowUpRight, ArrowDownRight, Clock, AlertTriangle } from "lucide-react";
import SectionBlock from "./SectionBlock";
import RevenueTrendChart from "./RevenueTrendChart";
import UrgentOrdersList from "./UrgentOrdersList";
import CashflowSummary from "./CashflowSummary";
import { overviewData, formatMoney } from "@/data/mockData";
import { cn } from "@/lib/utils";

const StatRow = ({ label, value, color, icon }: { label: string; value: string | number; color?: string; icon?: React.ReactNode }) => (
  <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
    <span className={cn("text-sm font-semibold text-money", color || "text-foreground")}>
      {typeof value === "number" ? formatMoney(value) : value}
    </span>
  </div>
);

const OverviewTab = () => {
  const { health, inventory } = overviewData;

  return (
    <div className="pb-24">
      {/* Business Health */}
      <SectionBlock title="Sức khỏe kinh doanh" icon={<Activity className="w-4 h-4 text-success" />}>
        <div className="bg-card rounded-lg border border-border/60 p-3">
          <StatRow label="Doanh thu thực" value={health.revenue} color="text-success" icon={<ArrowUpRight className="w-3.5 h-3.5 text-success" />} />
          <StatRow label="Lợi nhuận thực" value={health.profit} color="text-kpi-profit" icon={<ArrowUpRight className="w-3.5 h-3.5 text-kpi-profit" />} />
          <StatRow label="Đơn đang thuê" value={`${health.activeOrders} đơn`} icon={<Package className="w-3.5 h-3.5 text-muted-foreground" />} />
          <StatRow label="Đến hạn hôm nay" value={`${health.dueTodayOrders} đơn`} color="text-warning" icon={<Clock className="w-3.5 h-3.5 text-warning" />} />
          <StatRow label="Quá hạn" value={`${health.overdueOrders} đơn`} color="text-danger" icon={<AlertTriangle className="w-3.5 h-3.5 text-danger" />} />
        </div>
      </SectionBlock>

      {/* Cashflow */}
      <CashflowSummary />

      {/* Inventory */}
      <SectionBlock title="Tình trạng hàng hóa" icon={<Package className="w-4 h-4 text-primary" />}>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Đang giặt", value: inventory.washing, color: "text-kpi-profit", bg: "bg-kpi-profit/10" },
            { label: "Cần chuẩn bị", value: inventory.preparing, color: "text-warning", bg: "bg-warning/10" },
            { label: "Sẵn sàng", value: inventory.ready, color: "text-success", bg: "bg-success/10" },
            { label: "Đã bán", value: inventory.sold, color: "text-muted-foreground", bg: "bg-muted" },
          ].map((item) => (
            <div key={item.label} className={cn("rounded-lg p-2.5 text-center", item.bg)}>
              <p className={cn("text-2xl font-bold", item.color)}>{item.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{item.label}</p>
            </div>
          ))}
        </div>
      </SectionBlock>

      {/* Trend Chart */}
      <SectionBlock title="Xu hướng doanh thu" icon={<TrendingUp className="w-4 h-4 text-success" />}>
        <RevenueTrendChart />
      </SectionBlock>

      {/* Urgent Orders */}
      <SectionBlock title="Việc cần xử lý ngay" icon={<AlertCircle className="w-4 h-4 text-danger" />}>
        <UrgentOrdersList compact />
      </SectionBlock>
    </div>
  );
};

export default OverviewTab;
