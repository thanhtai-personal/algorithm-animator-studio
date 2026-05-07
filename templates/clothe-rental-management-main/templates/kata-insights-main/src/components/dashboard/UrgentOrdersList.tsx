import { Phone, Eye, Clock, AlertTriangle } from "lucide-react";
import { urgentOrders, formatMoney } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface UrgentOrdersListProps {
  compact?: boolean;
}

const UrgentOrdersList = ({ compact }: UrgentOrdersListProps) => {
  const dueSoon = compact ? urgentOrders.dueSoon.slice(0, 3) : urgentOrders.dueSoon;
  const overdue = compact ? urgentOrders.overdue.slice(0, 2) : urgentOrders.overdue;

  return (
    <div className="space-y-3">
      {/* Overdue */}
      {overdue.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-danger" />
            <span className="text-xs font-semibold text-danger">Quá hạn ({urgentOrders.overdue.length})</span>
          </div>
          <div className="space-y-2">
            {overdue.map((order) => (
              <div key={order.id} className="bg-danger/5 border border-danger/15 rounded-lg p-2.5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-foreground">{order.id}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-danger/10 text-danger font-medium">{order.dueDate}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{order.customer} · {order.items}</p>
                    <p className="text-xs text-danger font-medium mt-0.5">Phạt: {formatMoney(order.penalty)}</p>
                  </div>
                  <div className="flex gap-1.5 ml-2 shrink-0">
                    <button className="w-7 h-7 rounded-md bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                    </button>
                    <button className="w-7 h-7 rounded-md bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors">
                      <Eye className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Due soon */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Clock className="w-3.5 h-3.5 text-warning" />
          <span className="text-xs font-semibold text-warning">Đến hạn ({urgentOrders.dueSoon.length})</span>
        </div>
        <div className="space-y-2">
          {dueSoon.map((order) => (
            <div key={order.id} className="bg-card border border-border/60 rounded-lg p-2.5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-foreground">{order.id}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/10 text-warning font-medium">{order.dueDate}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{order.customer} · {order.items}</p>
                </div>
                <div className="flex gap-1.5 ml-2 shrink-0">
                  <button className="w-7 h-7 rounded-md bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors">
                    <Phone className="w-3 h-3 text-muted-foreground" />
                  </button>
                  <button className="w-7 h-7 rounded-md bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors">
                    <Eye className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UrgentOrdersList;
