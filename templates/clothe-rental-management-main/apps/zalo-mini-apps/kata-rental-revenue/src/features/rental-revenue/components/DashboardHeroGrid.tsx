import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";

export interface DashboardHeroItem {
  id: string;
  label: string;
  value: string;
  note: string;
  tone: "success" | "warning" | "danger" | "neutral";
  icon: LucideIcon;
}

export function DashboardHeroGrid({
  items,
}: {
  items: DashboardHeroItem[];
}) {
  return (
    <section className="dashboard-hero-grid">
      {items.map((item) => {
        const TrendIcon = item.tone === "danger" ? TrendingDown : TrendingUp;

        return (
          <article key={item.id} className={`dashboard-hero-card is-${item.tone}`}>
            <div className="dashboard-hero-card-head">
              <span className={`dashboard-hero-card-icon is-${item.tone}`}>
                <item.icon className="icon" />
              </span>
              <span className={`dashboard-hero-card-trend is-${item.tone}`}>
                <TrendIcon className="icon" />
              </span>
            </div>
            <p className="dashboard-hero-card-label">{item.label}</p>
            <strong className={`dashboard-hero-card-value is-${item.tone}`}>{item.value}</strong>
            <p className="dashboard-hero-card-note">{item.note}</p>
          </article>
        );
      })}
    </section>
  );
}
