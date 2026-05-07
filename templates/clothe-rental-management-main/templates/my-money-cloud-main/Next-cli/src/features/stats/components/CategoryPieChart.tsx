import { useI18n } from "@/lib/i18n";
import { ResponsiveContainer, Pie, Cell, PieChart } from "recharts"
import { formatCompactLabel } from "../utils";

export const CategoryPieChart = ({ incomePieData }: any) => {
  const { language } = useI18n();
  const renderLabel = ({ x, y, value }: { x: number; y: number; value: number }) => {
    const text = formatCompactLabel(Number(value), language);
    if (!text) return null;
    return (
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight={600}
        fill="hsl(var(--foreground))"
      >
        {text}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={incomePieData}
          dataKey="value"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
          label={renderLabel}
          labelLine={false}
        >
          {incomePieData.map((entry: any) => (
            <Cell key={entry.categoryId} fill={entry.color} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  )
}
