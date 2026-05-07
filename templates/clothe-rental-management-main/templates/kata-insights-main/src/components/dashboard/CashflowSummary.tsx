import { Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import SectionBlock from "./SectionBlock";
import { overviewData, formatMoney } from "@/data/mockData";
import { cn } from "@/lib/utils";

const CashflowSummary = () => {
  const { cashflow } = overviewData;

  const items = [
    { label: "Tiền vào thực", value: cashflow.moneyIn, color: "text-success", icon: <ArrowUpRight className="w-3.5 h-3.5 text-success" /> },
    { label: "Tiền ra thực", value: cashflow.moneyOut, color: "text-danger", icon: <ArrowDownRight className="w-3.5 h-3.5 text-danger" /> },
    { label: "Cọc đã thu", value: cashflow.depositCollected, color: "text-warning" },
    { label: "Cọc đã hoàn", value: cashflow.depositReturned, color: "text-muted-foreground" },
    { label: "Công nợ mở", value: cashflow.openDebt, color: "text-danger" },
  ];

  return (
    <SectionBlock title="Dòng tiền" icon={<Wallet className="w-4 h-4 text-warning" />}>
      <div className="bg-card rounded-lg border border-border/60 p-3">
        {items.map((item, i) => (
          <div key={item.label} className={cn("flex items-center justify-between py-2", i < items.length - 1 && "border-b border-border/50")}>
            <div className="flex items-center gap-2">
              {item.icon}
              <span className="text-sm text-muted-foreground">{item.label}</span>
            </div>
            <span className={cn("text-sm font-semibold text-money", item.color)}>
              {formatMoney(item.value)}
            </span>
          </div>
        ))}
      </div>
    </SectionBlock>
  );
};

export default CashflowSummary;
