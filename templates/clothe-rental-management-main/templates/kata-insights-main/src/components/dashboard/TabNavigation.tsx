import { cn } from "@/lib/utils";
import { BarChart3, Eye, AlertTriangle } from "lucide-react";

const tabs = [
  { value: "overview", label: "Tổng quan", icon: Eye },
  { value: "revenue", label: "Doanh thu", icon: BarChart3 },
  { value: "actions", label: "Cần xử lý", icon: AlertTriangle },
];

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TabNavigation = ({ activeTab, onTabChange }: TabNavigationProps) => {
  return (
    <div className="px-4 py-2 sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
      <div className="flex gap-1 p-1 bg-surface-sunken rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-md transition-all",
                activeTab === tab.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.value === "actions" && (
                <span className="ml-0.5 w-4 h-4 rounded-full bg-danger text-danger-foreground text-[10px] flex items-center justify-center font-bold">
                  8
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TabNavigation;
