import { View } from "react-native";
import Svg, { G, Path } from "react-native-svg";

type Slice = {
  value: number;
  color: string;
};

type Props = {
  data: Slice[];
  size?: number;
  innerRadius?: number;
};

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = (Math.PI / 180) * angle;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  if (![3, 6].includes(normalized.length)) return null;
  const full = normalized.length === 3 ? normalized.split("").map((c) => c + c).join("") : normalized;
  const int = Number.parseInt(full, 16);
  if (Number.isNaN(int)) return null;
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

function rgbToHsl(r: number, g: number, b: number) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function parseHsl(value: string) {
  const match = value.match(/hsla?\(([^)]+)\)/);
  if (!match) return null;
  const parts = match[1].split(",").map((part) => part.trim());
  if (parts.length < 3) return null;
  const h = Number.parseFloat(parts[0]);
  const s = Number.parseFloat(parts[1].replace("%", ""));
  const l = Number.parseFloat(parts[2].replace("%", ""));
  if ([h, s, l].some((num) => Number.isNaN(num))) return null;
  return { h, s, l };
}

function adjustLightness(color: string, delta: number) {
  const hsl = parseHsl(color);
  if (hsl) {
    const nextL = clamp(hsl.l + delta, 25, 80);
    return `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(nextL)}%)`;
  }
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  const hslFromRgb = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const nextL = clamp(hslFromRgb.l + delta, 25, 80);
  return `hsl(${hslFromRgb.h}, ${hslFromRgb.s}%, ${nextL}%)`;
}

function resolveSliceColor(color: string, index: number) {
  if (index === 0) return color;
  const step = Math.ceil(index / 2) * 8;
  const delta = index % 2 === 0 ? -step : step;
  return adjustLightness(color, delta);
}

function describeSlice(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number
) {
  const outerStart = polarToCartesian(cx, cy, outerRadius, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerRadius, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  if (innerRadius <= 0) {
    return [
      "M",
      cx,
      cy,
      "L",
      outerStart.x,
      outerStart.y,
      "A",
      outerRadius,
      outerRadius,
      0,
      largeArc,
      1,
      outerEnd.x,
      outerEnd.y,
      "Z",
    ].join(" ");
  }

  const innerStart = polarToCartesian(cx, cy, innerRadius, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, startAngle);
  return [
    "M",
    outerStart.x,
    outerStart.y,
    "A",
    outerRadius,
    outerRadius,
    0,
    largeArc,
    1,
    outerEnd.x,
    outerEnd.y,
    "L",
    innerStart.x,
    innerStart.y,
    "A",
    innerRadius,
    innerRadius,
    0,
    largeArc,
    0,
    innerEnd.x,
    innerEnd.y,
    "Z",
  ].join(" ");
}

export function PieChart({ data, size = 180, innerRadius }: Props) {
  const slices = data.filter((item) => item.value > 0);
  const total = slices.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0) return null;
  const donutRadius = innerRadius ?? Math.round(size * 0.35);
  const radius = size / 2;
  const gapAngle = slices.length > 1 ? 2 : 0;
  let startAngle = -90;
  const colorUsage = new Map<string, number>();

  return (
    <View>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G>
          {slices.map((slice, index) => {
            const angle = (slice.value / total) * 360;
            const endAngle = startAngle + Math.min(angle, 359.999);
            const trimmedStart = startAngle + gapAngle / 2;
            const trimmedEnd = endAngle - gapAngle / 2;
            const safeStart = trimmedEnd > trimmedStart ? trimmedStart : startAngle;
            const safeEnd = trimmedEnd > trimmedStart ? trimmedEnd : endAngle;
            const d = describeSlice(radius, radius, radius, donutRadius, safeStart, safeEnd);
            const used = colorUsage.get(slice.color) ?? 0;
            colorUsage.set(slice.color, used + 1);
            const fillColor = resolveSliceColor(slice.color, used);
            const currentStart = startAngle;
            startAngle = endAngle;
            return (
              <Path
                key={`${index}-${currentStart}`}
                d={d}
                fill={fillColor}
              />
            );
          })}
        </G>
      </Svg>
    </View>
  );
}
