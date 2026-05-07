export interface DashboardRankingItem {
  id: string;
  title: string;
  subtitle: string;
  leftMeta: string;
  rightMeta: string;
  amountLabel: string;
}

export function DashboardRankingSection({
  eyebrow,
  title,
  emptyMessage,
  items,
}: {
  eyebrow: string;
  title: string;
  emptyMessage: string;
  items: DashboardRankingItem[];
}) {
  return (
    <article className="zalo-card">
      <div className="dashboard-section-head">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="muted">{emptyMessage}</p>
      ) : (
        <div className="rank-list">
          {items.map((item, index) => (
            <article key={item.id} className="rank-card">
              <div className="rank-row">
                <span className="rank-index">#{index + 1}</span>
                <div className="rank-copy">
                  <strong>{item.title}</strong>
                  <p className="muted">{item.subtitle}</p>
                </div>
              </div>
              <div className="trend-row-meta">
                <span>{item.leftMeta}</span>
                <span>{item.rightMeta}</span>
              </div>
              <p className="rank-note">{item.amountLabel}</p>
            </article>
          ))}
        </div>
      )}
    </article>
  );
}
