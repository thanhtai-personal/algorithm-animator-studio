export type MarbleId = string;

export type MarbleConfig = {
  id: MarbleId;
  name: string;
  color: string;
  accent: string;
  stripeColor?: string;
};

const LEGACY: MarbleConfig[] = [
  { id: 'red', name: 'Blaze', color: '#ff416c', accent: '#ff9bb1' },
  { id: 'orange', name: 'Solar', color: '#ff9f43', accent: '#ffd09a' },
  { id: 'yellow', name: 'Volt', color: '#ffe66d', accent: '#fff3a8' },
  { id: 'green', name: 'Viper', color: '#2ed573', accent: '#8dffb8' },
  { id: 'cyan', name: 'Aqua', color: '#35e7ff', accent: '#b0f7ff' },
  { id: 'blue', name: 'Nova', color: '#4d7cff', accent: '#aabaff' },
  { id: 'purple', name: 'Pulse', color: '#b56cff', accent: '#e2bdff' },
  { id: 'white', name: 'Ghost', color: '#f5f7ff', accent: '#ffffff' },
];

const UNIQUE_BASE_COLORS = 96;
const MAX_MARBLES = 1000;

function hslToHex(hue: number, saturation: number, lightness: number) {
  const s = saturation / 100;
  const l = lightness / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((hue % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r1, g1, b1] = hp < 1 ? [c, x, 0]
    : hp < 2 ? [x, c, 0]
      : hp < 3 ? [0, c, x]
        : hp < 4 ? [0, x, c]
          : hp < 5 ? [x, 0, c]
            : [c, 0, x];
  const m = l - c / 2;
  const channel = (value: number) => Math.round((value + m) * 255).toString(16).padStart(2, '0');
  return `#${channel(r1)}${channel(g1)}${channel(b1)}`;
}

function generatedBase(index: number) {
  const hue = (index * 137.507764 + 19) % 360;
  const saturation = 70 + (index % 4) * 6;
  const lightness = 45 + (Math.floor(index / 4) % 3) * 7;
  const color = hslToHex(hue, saturation, lightness);
  const accent = hslToHex(hue + 12, Math.max(45, saturation - 18), Math.min(82, lightness + 24));
  return { color, accent, hue };
}

function buildMarbles() {
  const base: MarbleConfig[] = [...LEGACY];
  for (let index = LEGACY.length; index < UNIQUE_BASE_COLORS; index += 1) {
    const generated = generatedBase(index);
    base.push({
      id: `marble-${String(index + 1).padStart(3, '0')}`,
      name: `Marble ${String(index + 1).padStart(3, '0')}`,
      color: generated.color,
      accent: generated.accent,
    });
  }

  const roster = [...base];
  for (let index = UNIQUE_BASE_COLORS; index < MAX_MARBLES; index += 1) {
    const baseIndex = index % UNIQUE_BASE_COLORS;
    const tier = Math.floor(index / UNIQUE_BASE_COLORS);
    const original = base[baseIndex];
    const stripeHue = (baseIndex * 137.507764 + tier * 47 + 173) % 360;
    roster.push({
      id: `marble-${String(index + 1).padStart(4, '0')}`,
      name: `Marble ${String(index + 1).padStart(4, '0')}`,
      color: original.color,
      accent: original.accent,
      stripeColor: hslToHex(stripeHue, 88, 66 - (tier % 3) * 8),
    });
  }
  return roster;
}

export const MARBLES: MarbleConfig[] = buildMarbles();

export function createMarbleRoster(count: number) {
  const safe = Math.max(10, Math.min(MAX_MARBLES, Math.round(count)));
  return MARBLES.slice(0, safe);
}

export const marbleById = (id: MarbleId) => MARBLES.find((marble) => marble.id === id) ?? MARBLES[5];
