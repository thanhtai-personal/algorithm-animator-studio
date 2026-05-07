import { useId } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface RevenueAreaPoint {
  label: string;
  revenue: number;
  profit: number;
}

interface SingleAreaPoint {
  label: string;
  value: number;
}

interface RevenueProfitBarPoint {
  label: string;
  revenue: number;
  profit: number;
}

const BRUSH_VISIBLE_POINTS = 10;
const CHART_HEIGHT = 232;

function formatMoneyShort(value: number): string {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} tỷ`;
  if (absolute >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} tr`;
  if (absolute >= 1_000) return `${Math.round(value / 1_000)}k`;
  return value.toString();
}

function resolveBrushStartIndex(dataSize: number): number {
  if (dataSize <= BRUSH_VISIBLE_POINTS) return 0;
  return dataSize - BRUSH_VISIBLE_POINTS;
}

function RevenueTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ value?: number }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="dashboard-template-chart-tooltip">
      <p className="label">{label}</p>
      <p className="revenue">DT: {Number(payload[0]?.value ?? 0).toLocaleString("vi-VN")} đ</p>
      <p className="profit">LN: {Number(payload[1]?.value ?? 0).toLocaleString("vi-VN")} đ</p>
    </div>
  );
}

function SingleAreaTooltip({
  active,
  payload,
  label,
  valueLabel,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ value?: number }>;
  label?: string;
  valueLabel: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="dashboard-template-chart-tooltip">
      <p className="label">{label}</p>
      <p className="revenue">
        {valueLabel}: {Number(payload[0]?.value ?? 0).toLocaleString("vi-VN")}
      </p>
    </div>
  );
}

function RevenueProfitBarTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ value?: number }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="dashboard-template-chart-tooltip">
      <p className="label">{label}</p>
      <p className="revenue">DT: {Number(payload[0]?.value ?? 0).toLocaleString("vi-VN")} đ</p>
      <p className="profit">LN: {Number(payload[1]?.value ?? 0).toLocaleString("vi-VN")} đ</p>
    </div>
  );
}

function DashboardChartBrush({ dataSize }: { dataSize: number }) {
  if (dataSize <= BRUSH_VISIBLE_POINTS) return null;

  return (
    <Brush
      dataKey="label"
      height={24}
      startIndex={resolveBrushStartIndex(dataSize)}
      endIndex={dataSize - 1}
      travellerWidth={10}
      stroke="#b66f5f"
      fill="#f8efec"
    />
  );
}

export function DashboardRevenueAreaChart({
  data,
}: {
  data: RevenueAreaPoint[];
}) {
  const chartId = useId().replace(/:/g, "");
  const revenueGradient = `${chartId}-rev`;
  const profitGradient = `${chartId}-profit`;

  return (
    <div className="dashboard-template-chart-shell">
      <div className="dashboard-template-chart-legend">
        <div className="item">
          <span className="dot success" />
          <span>Doanh thu</span>
        </div>
        <div className="item">
          <span className="dot profit" />
          <span>Lợi nhuận</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id={revenueGradient} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(152 55% 42%)" stopOpacity={0.32} />
              <stop offset="100%" stopColor="hsl(152 55% 42%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id={profitGradient} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(200 65% 48%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(200 65% 48%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(221, 200, 193, 0.9)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#7b6a64" }}
            axisLine={false}
            tickLine={false}
            minTickGap={20}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#7b6a64" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatMoneyShort}
          />
          <Tooltip content={<RevenueTooltip />} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="hsl(152 55% 42%)"
            fill={`url(#${revenueGradient})`}
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="profit"
            stroke="hsl(200 65% 48%)"
            fill={`url(#${profitGradient})`}
            strokeWidth={2}
          />
          <DashboardChartBrush dataSize={data.length} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const SINGLE_SERIES_COLORS = {
  warning: {
    stroke: "hsl(36 90% 52%)",
    gradient: "hsl(36 90% 52%)",
  },
  primary: {
    stroke: "hsl(15 55% 48%)",
    gradient: "hsl(15 55% 48%)",
  },
} as const;

export function DashboardSingleAreaChart({
  data,
  valueLabel,
  tone,
}: {
  data: SingleAreaPoint[];
  valueLabel: string;
  tone: keyof typeof SINGLE_SERIES_COLORS;
}) {
  const chartId = useId().replace(/:/g, "");
  const gradientId = `${chartId}-single`;
  const palette = SINGLE_SERIES_COLORS[tone];

  return (
    <div className="dashboard-template-chart-shell">
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.gradient} stopOpacity={0.32} />
              <stop offset="100%" stopColor={palette.gradient} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(221, 200, 193, 0.9)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#7b6a64" }}
            axisLine={false}
            tickLine={false}
            minTickGap={20}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#7b6a64" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            content={(props) => (
              <SingleAreaTooltip
                active={props.active}
                payload={props.payload as unknown as ReadonlyArray<{ value?: number }>}
                label={String(props.label ?? "")}
                valueLabel={valueLabel}
              />
            )}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={palette.stroke}
            fill={`url(#${gradientId})`}
            strokeWidth={2}
          />
          <DashboardChartBrush dataSize={data.length} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DashboardRevenueProfitBarChart({
  data,
}: {
  data: RevenueProfitBarPoint[];
}) {
  return (
    <div className="dashboard-template-chart-shell">
      <div className="dashboard-template-chart-legend">
        <div className="item">
          <span className="dot success" />
          <span>Doanh thu</span>
        </div>
        <div className="item">
          <span className="dot profit" />
          <span>Lợi nhuận</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(221, 200, 193, 0.9)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#7b6a64" }}
            axisLine={false}
            tickLine={false}
            minTickGap={18}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#7b6a64" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatMoneyShort}
          />
          <Tooltip content={<RevenueProfitBarTooltip />} />
          <Bar dataKey="revenue" name="Doanh thu" fill="hsl(152 55% 42%)" radius={[7, 7, 0, 0]} maxBarSize={24} />
          <Bar dataKey="profit" name="Lợi nhuận" fill="hsl(200 65% 48%)" radius={[7, 7, 0, 0]} maxBarSize={24} />
          <DashboardChartBrush dataSize={data.length} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
