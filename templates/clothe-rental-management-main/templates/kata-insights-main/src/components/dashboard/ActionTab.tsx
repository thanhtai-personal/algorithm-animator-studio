import { AlertTriangle, Clock, Droplets, Package, FileText, CreditCard, Phone, Eye, CheckCircle, ArrowRight } from "lucide-react";
import SectionBlock from "./SectionBlock";
import UrgentOrdersList from "./UrgentOrdersList";
import { urgentOrders, shiftLog, debtAlerts, formatMoney } from "@/data/mockData";
import { cn } from "@/lib/utils";

const ActionTab = () => {
  return (
    <div className="pb-24">
      {/* Urgent orders full list */}
      <SectionBlock title="Đơn cần xử lý" icon={<AlertTriangle className="w-4 h-4 text-danger" />}>
        <UrgentOrdersList />
      </SectionBlock>

      {/* Items to prepare */}
      <SectionBlock title="Đồ cần chuẩn bị" icon={<Package className="w-4 h-4 text-warning" />}>
        <div className="space-y-2">
          {urgentOrders.preparing.map((item) => {
            const statusColor = item.status === "Sẵn sàng" ? "text-success bg-success/10" :
              item.status === "Đang giặt" ? "text-kpi-profit bg-kpi-profit/10" :
                "text-warning bg-warning/10";
            return (
              <div key={item.id} className="bg-card border border-border/60 rounded-lg p-2.5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-foreground">{item.id}</span>
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", statusColor)}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.items}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Lấy: {item.pickupDate}</p>
                  </div>
                  <button className="text-xs text-primary font-medium flex items-center gap-0.5 shrink-0">
                    Xử lý <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </SectionBlock>

      {/* Debt alerts */}
      <SectionBlock title="Cảnh báo công nợ" icon={<CreditCard className="w-4 h-4 text-danger" />}>
        <div className="space-y-2">
          {debtAlerts.map((alert) => (
            <div key={alert.orderId} className="bg-danger/5 border border-danger/15 rounded-lg p-2.5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-foreground">{alert.customer}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{alert.orderId} · Quá {alert.daysOverdue} ngày</p>
                  <p className="text-sm font-semibold text-danger text-money mt-0.5">{formatMoney(alert.amount)}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button className="w-7 h-7 rounded-md bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors">
                    <Phone className="w-3 h-3 text-muted-foreground" />
                  </button>
                  <button className="text-xs text-primary font-medium px-2 py-1 rounded-md bg-primary/10 hover:bg-primary/15 transition-colors">
                    Thu nợ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionBlock>

      {/* Shift log */}
      <SectionBlock title="Nhật ký ca gần đây" icon={<FileText className="w-4 h-4 text-muted-foreground" />}>
        <div className="bg-card rounded-lg border border-border/60 p-3">
          {shiftLog.map((log, i) => (
            <div key={i} className={cn("flex items-start gap-3 py-2", i < shiftLog.length - 1 && "border-b border-border/50")}>
              <span className="text-[11px] text-muted-foreground font-mono w-10 shrink-0 pt-0.5">{log.time}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground">{log.action}</span>
                  <span className="text-[10px] text-muted-foreground">· {log.user}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionBlock>
    </div>
  );
};

export default ActionTab;
