import { DollarSign, TrendingUp, PieChart, ArrowUpRight, ArrowDownRight } from "lucide-react";
import SectionBlock from "./SectionBlock";
import RevenueTrendChart from "./RevenueTrendChart";
import { revenueData, formatMoney } from "@/data/mockData";
import { cn } from "@/lib/utils";

const RevenueRow = ({ label, value, color, bold, indent }: { label: string; value: number; color?: string; bold?: boolean; indent?: boolean }) => (
  <div className={cn("flex items-center justify-between py-2 border-b border-border/50 last:border-0", indent && "pl-4")}>
    <span className={cn("text-sm", bold ? "font-semibold text-foreground" : "text-muted-foreground")}>{label}</span>
    <span className={cn("text-sm text-money", bold ? "font-bold" : "font-semibold", color || "text-foreground")}>
      {formatMoney(value)}
    </span>
  </div>
);

const RevenueTab = () => {
  const { comparison } = revenueData;
  const revenueChange = ((comparison.thisPeriod.revenue - comparison.lastPeriod.revenue) / comparison.lastPeriod.revenue * 100).toFixed(1);
  const profitChange = ((comparison.thisPeriod.profit - comparison.lastPeriod.profit) / comparison.lastPeriod.profit * 100).toFixed(1);

  return (
    <div className="pb-24">
      {/* Revenue Breakdown */}
      <SectionBlock title="Phân tích doanh thu" icon={<DollarSign className="w-4 h-4 text-success" />}>
        <div className="bg-card rounded-lg border border-border/60 p-3">
          <RevenueRow label="Doanh thu gộp" value={revenueData.gross} bold />
          <RevenueRow label="Giảm trừ / Khuyến mãi" value={-revenueData.discount} color="text-muted-foreground" indent />
          <RevenueRow label="Hoàn cọc" value={-revenueData.refund} color="text-muted-foreground" indent />
          <RevenueRow label="Doanh thu thực" value={revenueData.net} color="text-success" bold />
        </div>
      </SectionBlock>

      {/* Deposit & Expenses */}
      <SectionBlock title="Cọc & Chi phí" icon={<DollarSign className="w-4 h-4 text-warning" />}>
        <div className="bg-card rounded-lg border border-border/60 p-3">
          <RevenueRow label="Tiền cọc thu" value={revenueData.depositIn} color="text-success" />
          <RevenueRow label="Tiền cọc hoàn" value={-revenueData.depositOut} color="text-danger" />
          <RevenueRow label="Chi phí phát sinh" value={-revenueData.expenses} color="text-danger" />
        </div>
      </SectionBlock>

      {/* Profit */}
      <SectionBlock title="Lợi nhuận" icon={<TrendingUp className="w-4 h-4 text-kpi-profit" />}>
        <div className="bg-card rounded-lg border border-border/60 p-3">
          <RevenueRow label="Lợi nhuận gộp" value={revenueData.grossProfit} bold />
          <RevenueRow label="Lợi nhuận thực" value={revenueData.netProfit} color="text-kpi-profit" bold />
          <RevenueRow label="Công nợ phát sinh" value={revenueData.newDebt} color="text-danger" />
          <RevenueRow label="Công nợ còn lại" value={revenueData.remainingDebt} color="text-danger" bold />
        </div>
      </SectionBlock>

      {/* Revenue by Category */}
      <SectionBlock title="Cơ cấu doanh thu" icon={<PieChart className="w-4 h-4 text-primary" />}>
        <div className="bg-card rounded-lg border border-border/60 p-3 space-y-3">
          {revenueData.byCategory.map((cat) => (
            <div key={cat.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">{cat.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{cat.percent}%</span>
                  <span className="text-sm font-semibold text-money text-foreground">{formatMoney(cat.value)}</span>
                </div>
              </div>
              <div className="h-1.5 bg-surface-sunken rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${cat.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </SectionBlock>

      {/* Chart */}
      <SectionBlock title="Xu hướng" icon={<TrendingUp className="w-4 h-4 text-success" />}>
        <RevenueTrendChart />
      </SectionBlock>

      {/* Comparison */}
      <SectionBlock title="So sánh kỳ trước" icon={<ArrowUpRight className="w-4 h-4 text-success" />}>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-card rounded-lg border border-border/60 p-3">
            <p className="text-[11px] text-muted-foreground">Doanh thu</p>
            <p className="text-lg font-bold text-money text-foreground mt-0.5">
              {formatMoney(comparison.thisPeriod.revenue)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Kỳ trước: {formatMoney(comparison.lastPeriod.revenue)}
            </p>
            <div className="flex items-center gap-0.5 mt-1 text-success">
              <ArrowUpRight className="w-3 h-3" />
              <span className="text-[11px] font-semibold">+{revenueChange}%</span>
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border/60 p-3">
            <p className="text-[11px] text-muted-foreground">Lợi nhuận</p>
            <p className="text-lg font-bold text-money text-foreground mt-0.5">
              {formatMoney(comparison.thisPeriod.profit)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Kỳ trước: {formatMoney(comparison.lastPeriod.profit)}
            </p>
            <div className="flex items-center gap-0.5 mt-1 text-success">
              <ArrowUpRight className="w-3 h-3" />
              <span className="text-[11px] font-semibold">+{profitChange}%</span>
            </div>
          </div>
        </div>
      </SectionBlock>
    </div>
  );
};

export default RevenueTab;
