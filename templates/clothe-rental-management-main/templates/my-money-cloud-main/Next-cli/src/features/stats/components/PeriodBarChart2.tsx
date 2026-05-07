import { formatCompactNumber } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";
import { ResponsiveContainer, YAxis, BarChart, XAxis, Bar, LabelList } from "recharts";
import { CHART_COLORS } from "../constants";

export const PeriodBarChart2 = ({
  periodData,
  periodDomainMax,
  tickLine = false,
  axisLine = false,
  tick,
  chartColors = CHART_COLORS,
}: any) => {
  const { language } = useI18n();
  const formatLabel = (value: number) => formatCompactNumber(Number(value), language);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={periodData}
        layout="vertical"
        margin={{ top: 8, right: 64, left: 0, bottom: 8 }}
        barCategoryGap={12}
      >
        <XAxis type="number" domain={[0, periodDomainMax]} hide />
        <YAxis
          type="category"
          dataKey="label"
          tickLine={tickLine}
          axisLine={axisLine}
          tick={tick ?? { fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          width={88}
        />
        <Bar dataKey="income" fill={chartColors.income} radius={[0, 8, 8, 0]} barSize={34}>
          <LabelList dataKey="income" position="right" formatter={formatLabel} />
        </Bar>
        <Bar dataKey="expense" fill={chartColors.expense} radius={[0, 8, 8, 0]} barSize={34}>
          <LabelList dataKey="expense" position="right" formatter={formatLabel} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
