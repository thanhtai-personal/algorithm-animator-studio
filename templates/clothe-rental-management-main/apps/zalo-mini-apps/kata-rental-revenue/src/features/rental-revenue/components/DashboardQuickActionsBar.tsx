import type { LucideIcon } from "lucide-react";

export interface DashboardQuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

export function DashboardQuickActionsBar({
  actions,
  activeId,
}: {
  actions: DashboardQuickAction[];
  activeId: string;
}) {
  return (
    <div className="dashboard-quick-bar">
      <div className="dashboard-quick-bar-inner">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            className={action.id === activeId ? "dashboard-quick-button is-active" : "dashboard-quick-button"}
            onClick={action.onClick}
          >
            <span className={action.id === activeId ? "dashboard-quick-button-icon is-active" : "dashboard-quick-button-icon"}>
              <action.icon className="icon" />
            </span>
            <span className="dashboard-quick-button-label">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
