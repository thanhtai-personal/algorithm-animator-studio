import { AbsoluteFill, Img } from "remotion";
import type { FivePrayersTrack } from "./fivePrayersContent";

const THEMES = {
  spirit: { a: "#071a2d", b: "#17445e", glow: "#f7d98a", accent: "#d5f0ff" },
  faith: { a: "#160d28", b: "#4a214f", glow: "#ffd18a", accent: "#f4dfbd" },
  commandments: { a: "#171511", b: "#514332", glow: "#f0d39a", accent: "#e8dcc7" },
  beatitudes: { a: "#0b2430", b: "#6d452d", glow: "#ffd998", accent: "#d8eee9" },
  rosary: { a: "#151329", b: "#3b315f", glow: "#f4d3a0", accent: "#e6ddff" },
} as const;

export function FivePrayersVisuals(props: {
  track: FivePrayersTrack;
  time: number;
  portrait: boolean;
  shortestSide: number;
}) {
  const theme = THEMES[props.track.theme];
  const localTime = props.time - props.track.start;
  const drift = Math.sin(localTime * 0.08) * 2.2;
  const pulse = 0.5 + Math.sin(localTime * 0.35) * 0.5;

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        background: [
          `radial-gradient(circle at 50% 28%, ${theme.glow}33 0%, transparent 34%)`,
          `linear-gradient(145deg, ${theme.a} 0%, ${theme.b} 58%, #07080b 100%)`,
        ].join(","),
      }}
    >
      <PrayerArtwork
        track={props.track}
        portrait={props.portrait}
        time={localTime}
      />
      <AbsoluteFill
        style={{
          background: [
            `linear-gradient(145deg, ${theme.a}b8 0%, ${theme.b}82 52%, #07080bd9 100%)`,
            `radial-gradient(circle at 50% 30%, transparent 0%, ${theme.a}66 52%, #050609d9 100%)`,
          ].join(","),
        }}
      />
      <LightRays glow={theme.glow} time={localTime} />
      <Stars accent={theme.accent} time={localTime} />
      <div
        style={{
          position: "absolute",
          inset: props.portrait ? "10% -30%" : "-20% 4%",
          borderRadius: "50%",
          border: `1px solid ${theme.glow}22`,
          boxShadow: `0 0 ${120 + pulse * 80}px ${theme.glow}1f inset`,
          transform: `translateY(${drift}%) rotate(${localTime * 0.08}deg)`,
        }}
      />
      <SacredSymbol
        theme={props.track.theme}
        color={theme.accent}
        glow={theme.glow}
        shortestSide={props.shortestSide}
        portrait={props.portrait}
        time={localTime}
      />
      <AbsoluteFill
        style={{
          background: [
            "linear-gradient(180deg, rgba(3,5,9,0.2) 0%, transparent 35%, rgba(3,5,9,0.8) 100%)",
            "radial-gradient(circle at center, transparent 38%, rgba(0,0,0,0.48) 100%)",
          ].join(","),
        }}
      />
    </AbsoluteFill>
  );
}

function PrayerArtwork(props: {
  track: FivePrayersTrack;
  portrait: boolean;
  time: number;
}) {
  const slowZoom = 1.055 + Math.min(0.075, props.time * 0.00022);
  const driftX = Math.sin(props.time * 0.035) * (props.portrait ? 1.4 : 0.8);
  const driftY = Math.sin(props.time * 0.027 + 0.8) * 1.2;

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#07080b" }}>
      <Img
        src={props.track.artwork.imageUrl}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: props.track.artwork.objectPosition,
          opacity: 0.8,
          filter: props.track.theme === "beatitudes"
            ? "sepia(0.34) saturate(0.75) contrast(1.08) brightness(0.72)"
            : "saturate(0.86) contrast(1.06) brightness(0.7)",
          transform: `translate(${driftX}%, ${driftY}%) scale(${slowZoom})`,
          transformOrigin: "50% 46%",
        }}
      />
      <AbsoluteFill
        style={{
          background: props.portrait
            ? "linear-gradient(180deg, rgba(3,4,8,0.18) 0%, rgba(3,4,8,0.02) 34%, rgba(3,4,8,0.68) 76%, rgba(3,4,8,0.9) 100%)"
            : "linear-gradient(90deg, rgba(3,4,8,0.42) 0%, rgba(3,4,8,0.04) 48%, rgba(3,4,8,0.46) 100%)",
        }}
      />
    </AbsoluteFill>
  );
}

function LightRays({ glow, time }: { glow: string; time: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "-14%",
        width: "110%",
        height: "90%",
        transform: `translateX(-50%) rotate(${Math.sin(time * 0.04) * 2}deg)`,
        transformOrigin: "50% 0%",
        opacity: 0.55,
      }}
    >
      {Array.from({ length: 9 }, (_, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            left: `${45 + (index - 4) * 4}%`,
            top: 0,
            width: "7%",
            height: "110%",
            background: `linear-gradient(180deg, ${glow}3d, transparent 80%)`,
            clipPath: "polygon(42% 0, 58% 0, 100% 100%, 0 100%)",
            transform: `rotate(${(index - 4) * 5}deg)`,
            transformOrigin: "50% 0%",
          }}
        />
      ))}
    </div>
  );
}

function Stars({ accent, time }: { accent: string; time: number }) {
  return (
    <>
      {Array.from({ length: 26 }, (_, index) => {
        const x = (index * 37) % 97;
        const y = (index * 61) % 88;
        const size = 2 + (index % 4);
        const opacity = 0.16 + ((index * 13) % 40) / 100;
        return (
          <span
            key={index}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              borderRadius: 999,
              background: accent,
              opacity: opacity * (0.8 + Math.sin(time * 0.22 + index) * 0.2),
              boxShadow: `0 0 ${size * 4}px ${accent}`,
            }}
          />
        );
      })}
    </>
  );
}

function SacredSymbol(props: {
  theme: FivePrayersTrack["theme"];
  color: string;
  glow: string;
  shortestSide: number;
  portrait: boolean;
  time: number;
}) {
  const size = props.shortestSide * (props.portrait ? 0.62 : 0.5);
  const scale = 1 + Math.sin(props.time * 0.11) * 0.02;
  return (
    <svg
      viewBox="0 0 400 400"
      style={{
        position: "absolute",
        left: "50%",
        top: props.portrait ? "31%" : "40%",
        width: size,
        height: size,
        transform: `translate(-50%, -50%) scale(${scale})`,
        color: props.color,
        filter: `drop-shadow(0 0 34px ${props.glow}55)`,
        opacity: 0.88,
      }}
    >
      {props.theme === "spirit" ? <SpiritSymbol /> : null}
      {props.theme === "faith" ? <FaithSymbol /> : null}
      {props.theme === "commandments" ? <CommandmentsSymbol /> : null}
      {props.theme === "beatitudes" ? <BeatitudesSymbol /> : null}
      {props.theme === "rosary" ? <RosarySymbol /> : null}
    </svg>
  );
}

function SpiritSymbol() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="200" cy="190" r="112" opacity="0.28" />
      <path d="M92 212c52-8 79-44 108-87 28 43 55 79 108 87-32 8-59 2-84-12-3 45-12 79-24 102-12-23-21-57-24-102-25 14-52 20-84 12Z" />
      <path d="M200 90v-34M180 64h40" opacity="0.78" />
    </g>
  );
}

function FaithSymbol() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round">
      <circle cx="200" cy="200" r="128" opacity="0.24" />
      <path d="M200 74v252M132 150h136" />
      <path d="M96 306c31-37 66-55 104-55 38 0 73 18 104 55" opacity="0.46" />
    </g>
  );
}

function CommandmentsSymbol() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round">
      <path d="M72 318V126c0-40 31-72 70-72 25 0 47 13 58 34 11-21 33-34 58-34 39 0 70 32 70 72v192H72Z" />
      {[132, 172, 212, 252].map((y) => <path key={y} d={`M112 ${y}h64M224 ${y}h64`} opacity="0.62" />)}
      <path d="M200 90v228" opacity="0.35" />
    </g>
  );
}

function BeatitudesSymbol() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="200" cy="112" r="44" opacity="0.7" />
      <path d="M56 304 138 196l48 62 42-52 116 98H56Z" />
      <path d="M120 330h160" opacity="0.45" />
      <path d="M88 94h44M268 94h44M200 36v34" opacity="0.5" />
    </g>
  );
}

function RosarySymbol() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round">
      <ellipse cx="200" cy="166" rx="105" ry="126" opacity="0.72" />
      {Array.from({ length: 14 }, (_, index) => {
        const angle = Math.PI * 2 * index / 14;
        const x = 200 + Math.cos(angle) * 105;
        const y = 166 + Math.sin(angle) * 126;
        return <circle key={index} cx={x} cy={y} r="9" fill="currentColor" stroke="none" />;
      })}
      <path d="M200 292v68M174 326h52" strokeWidth="10" />
      <circle cx="200" cy="292" r="13" fill="currentColor" stroke="none" />
    </g>
  );
}
