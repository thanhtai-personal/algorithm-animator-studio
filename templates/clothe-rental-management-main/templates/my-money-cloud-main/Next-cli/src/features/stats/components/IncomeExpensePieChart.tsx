import { useI18n } from "@/lib/i18n";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, LabelList } from "recharts";
import { CHART_COLORS } from "../constants";
import { formatCompactNumber } from "@/lib/currency";

export const IncomeExpensePieChart = ({
  totals,
  chartColors = CHART_COLORS,
}: any) => {
  const { t, language } = useI18n();

  const data = [
    { name: t("dashboard.income"), value: totals.income, color: chartColors.income },
    { name: t("dashboard.expense"), value: totals.expense, color: chartColors.expense },
  ];

  const maxValue = Math.max(totals.income, totals.expense);
  const domainMax = maxValue > 0 ? maxValue : 1;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 80, left: 0, bottom: 5 }}>
        <XAxis type="number" domain={[0, domainMax]} hide />
        <YAxis 
          type="category" 
          dataKey="name" 
          tickLine={false}
          axisLine={false}
          width={80}
          tick={{ fontSize: 14, fill: "hsl(var(--foreground))", fontWeight: 600 }}
        />
        <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={34}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            formatter={(value: number) => formatCompactNumber(Number(value), language)}
            style={{ fontSize: 13, fontWeight: 600, fill: "hsl(var(--foreground))" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
