import { Plus, CreditCard, RotateCcw, FileText, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  { icon: Plus, label: "Tạo đơn", primary: true },
  { icon: CreditCard, label: "Thu tiền" },
  { icon: RotateCcw, label: "Trả đồ" },
  { icon: FileText, label: "Công nợ" },
  { icon: CalendarDays, label: "Lịch" },
];

const QuickActionsBar = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border/60 px-2 pb-[env(safe-area-inset-bottom,8px)] pt-1.5">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              className={cn(
                "flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-lg transition-colors min-w-[56px]",
                action.primary
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center",
                action.primary
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-surface-sunken"
              )}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActionsBar;
