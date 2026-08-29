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

export interface SubscribeWallMount {
  x: number;
  y: number;
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

export function subscribeWallMount(
  firstInstrument: { x: number; y: number },
  courseWidth = 720,
): SubscribeWallMount {
  const buttonWidth = 270;
  return {
    x: firstInstrument.x <= courseWidth / 2 ? courseWidth * 0.77 : courseWidth * 0.23,
    y: firstInstrument.y - 165,
    width: buttonWidth,
    height: buttonWidth / 4.7,
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

export function drawSubscribeWallSign2D(
  ctx: CanvasRenderingContext2D,
  mount: SubscribeWallMount,
  timeMs: number,
) {
  const frame = subscribeReminderFrameAt(timeMs);
  const light = frame.visible ? frame.opacity : 0;
  const baseAlpha = ctx.globalAlpha;
  const plateWidth = mount.width + mount.height * 0.28;
  const plateHeight = mount.height + mount.height * 0.26;
  ctx.save();
  ctx.translate(mount.x, mount.y);

  ctx.lineWidth = Math.max(2, mount.height * 0.055);
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(194, 204, 214, .78)";
  ctx.beginPath();
  ctx.moveTo(0, -plateHeight * 0.98);
  ctx.lineTo(-plateWidth * 0.34, -plateHeight * 0.48);
  ctx.moveTo(0, -plateHeight * 0.98);
  ctx.lineTo(plateWidth * 0.34, -plateHeight * 0.48);
  ctx.stroke();

  ctx.shadowColor = "rgba(0, 0, 0, .5)";
  ctx.shadowBlur = mount.height * 0.24;
  ctx.shadowOffsetY = mount.height * 0.12;
  ctx.fillStyle = "#242a31";
  roundedRect(ctx, -plateWidth / 2, -plateHeight / 2, plateWidth, plateHeight, mount.height * 0.29);
  ctx.fill();

  ctx.shadowColor = light > 0 ? `rgba(255, 0, 51, ${0.32 * light})` : "transparent";
  ctx.shadowBlur = mount.height * (0.08 + light * 0.25);
  ctx.shadowOffsetY = 0;
  ctx.globalAlpha = baseAlpha * (0.88 + light * 0.12);
  drawSubscribeButtonFace2D(ctx, mount.width, mount.height);

  ctx.globalAlpha = baseAlpha;
  ctx.shadowColor = "transparent";
  ctx.fillStyle = "#dce3e8";
  ctx.beginPath();
  ctx.arc(0, -plateHeight * 0.98, mount.height * 0.075, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
