import { formatCompactNumber } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";
import { ResponsiveContainer, YAxis, BarChart } from "recharts";

export const PeriodBarChart = ({
  periodData,
  periodDomainMax,
  tickLine = false,
  axisLine = false,
  width = 56,
  periodDomainMin = 0,
  tick,
  tickFormatter,
}: any) => {
  const { language} = useI18n();

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={periodData ?? []} margin={{ top: 32, right: 0, left: 0, bottom: 0 }}>
        <YAxis
          tickLine={tickLine}
          axisLine={axisLine}
          width={width}
          domain={[periodDomainMin, periodDomainMax]}
          tick={tick ??{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          tickFormatter={tickFormatter ?? ((value) => formatCompactNumber(Number(value), language))}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};