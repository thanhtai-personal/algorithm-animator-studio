const REMINDER_START_MS = 850;
const REMINDER_ENTER_END_MS = 1_250;
const REMINDER_EXIT_START_MS = 3_900;
const REMINDER_END_MS = 4_650;

export interface SubscribeReminderFrame {
  visible: boolean;
  opacity: number;
  scale: number;
  translateY: number;
}

export interface SubscribeReminderLayout {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function easeOutCubic(value: number) {
  return 1 - (1 - value) ** 3;
}

function smoothstep(value: number) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

export function subscribeReminderFrameAt(timeMs: number): SubscribeReminderFrame {
  if (timeMs <= REMINDER_START_MS || timeMs >= REMINDER_END_MS) {
    return { visible: false, opacity: 0, scale: 0.92, translateY: 14 };
  }

  if (timeMs < REMINDER_ENTER_END_MS) {
    const progress = easeOutCubic((timeMs - REMINDER_START_MS) / (REMINDER_ENTER_END_MS - REMINDER_START_MS));
    return {
      visible: true,
      opacity: progress,
      scale: 0.92 + progress * 0.08,
      translateY: (1 - progress) * 14,
    };
  }

  if (timeMs <= REMINDER_EXIT_START_MS) {
    return { visible: true, opacity: 1, scale: 1, translateY: 0 };
  }

  const progress = smoothstep((timeMs - REMINDER_EXIT_START_MS) / (REMINDER_END_MS - REMINDER_EXIT_START_MS));
  return {
    visible: true,
    opacity: 1 - progress,
    scale: 1 - progress * 0.04,
    translateY: -progress * 10,
  };
}

export function subscribeReminderLayout(width: number, height: number): SubscribeReminderLayout {
  const buttonWidth = Math.min(width * 0.58, height * 0.42, 460);
  const buttonHeight = buttonWidth / 4.7;
  return {
    centerX: width / 2,
    centerY: Math.min(height * 0.82, height * 0.9 - buttonHeight / 2),
    width: buttonWidth,
    height: buttonHeight,
  };
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.arcTo(x + width, y, x + width, y + height, safeRadius);
  ctx.arcTo(x + width, y + height, x, y + height, safeRadius);
  ctx.arcTo(x, y + height, x, y, safeRadius);
  ctx.arcTo(x, y, x + width, y, safeRadius);
  ctx.closePath();
}

export function drawSubscribeButtonFace2D(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const left = -width / 2;
  const top = -height / 2;
  const radius = height * 0.27;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.42)";
  ctx.shadowBlur = height * 0.2;
  ctx.shadowOffsetY = height * 0.08;
  ctx.fillStyle = "#ff0033";
  roundedRect(ctx, left, top, width, height, radius);
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.lineWidth = Math.max(1, height * 0.025);
  ctx.strokeStyle = "rgba(255,255,255,.24)";
  roundedRect(ctx, left, top, width, height, radius);
  ctx.stroke();

  const iconX = left + height * 0.82;
  const iconRadius = height * 0.27;
  ctx.fillStyle = "rgba(255,255,255,.18)";
  ctx.beginPath();
  ctx.arc(iconX, 0, iconRadius, 0, Math.PI * 2);
  ctx.fill();

  const triangleSize = height * 0.18;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(iconX - triangleSize * 0.45, -triangleSize);
  ctx.lineTo(iconX + triangleSize, 0);
  ctx.lineTo(iconX - triangleSize * 0.45, triangleSize);
  ctx.closePath();
  ctx.fill();

  ctx.font = `800 ${height * 0.3}px Inter, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("SUBSCRIBE", height * 0.31, 0);
  ctx.restore();
}

export function drawSubscribeReminder2D(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timeMs: number,
) {
  const frame = subscribeReminderFrameAt(timeMs);
  if (!frame.visible || frame.opacity <= 0) return;

  const layout = subscribeReminderLayout(width, height);
  ctx.save();
  ctx.globalAlpha *= frame.opacity;
  ctx.translate(layout.centerX, layout.centerY + frame.translateY);
  ctx.scale(frame.scale, frame.scale);
  drawSubscribeButtonFace2D(ctx, layout.width, layout.height);
  ctx.restore();
}
