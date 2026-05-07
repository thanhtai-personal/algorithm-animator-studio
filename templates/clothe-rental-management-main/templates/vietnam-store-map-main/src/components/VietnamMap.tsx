import { useState } from "react";
import vietnamMap from "@/assets/vietnam-map-3d.png";

type Store = {
  id: string;
  name: string;
  province: string;
  url: string;
  leftPct: number;
  topPct: number;
  color: string;
  ring: string;
};

const stores: Store[] = [
  {
    id: "july",
    name: "July",
    province: "Phú Thọ",
    url: "https://tiem-thue-do.vercel.app/july",
    leftPct: 40,
    topPct: 22,
    color: "oklch(0.72 0.18 10)",
    ring: "oklch(0.85 0.12 10)",
  },
  {
    id: "kata",
    name: "KATA",
    province: "Đắk Nông",
    url: "https://tiem-thue-do.vercel.app/kata",
    leftPct: 55,
    topPct: 65,
    color: "oklch(0.6 0.22 290)",
    ring: "oklch(0.8 0.15 290)",
  },
];

export function VietnamMap() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="relative mx-auto w-full max-w-[480px] aspect-[704/1280]">
      {/* Soft glow halo */}
      <div
        className="pointer-events-none absolute inset-0 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, oklch(0.85 0.1 280 / 0.35), transparent 65%)",
        }}
      />

      {/* Map image */}
      <img
        src={vietnamMap}
        alt="Bản đồ Việt Nam"
        width={768}
        height={1376}
        className="relative h-full w-full select-none object-contain"
        style={{
          filter: "drop-shadow(0 25px 35px oklch(0.4 0.1 260 / 0.35))",
        }}
        draggable={false}
      />

      {/* Markers overlay */}
      <div className="absolute inset-0">
        {stores.map((store) => {
          const isHover = hovered === store.id;

          return (
            <a
              key={store.id}
              href={store.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group absolute z-10"
              style={{
                left: `${store.leftPct}%`,
                top: `${store.topPct}%`,
                transform: "translate(-50%, -50%)",
              }}
              onMouseEnter={() => setHovered(store.id)}
              onMouseLeave={() => setHovered(null)}
              aria-label={`${store.name} tại ${store.province}`}
            >
              {/* Pulse rings */}
              <span
                className="pulse-ring absolute left-1/2 top-1/2 h-12 w-12 rounded-full"
                style={{ border: `2px solid ${store.ring}` }}
              />
              <span
                className="pulse-ring absolute left-1/2 top-1/2 h-12 w-12 rounded-full"
                style={{
                  border: `2px solid ${store.ring}`,
                  animationDelay: "1s",
                }}
              />

              {/* Soft 3D clay marker */}
              <div
                className="map-marker relative flex flex-col items-center"
                style={{
                  transform: "translate(-50%, -100%)",
                  filter: isHover
                    ? `drop-shadow(0 14px 20px ${store.color.replace(")", " / 0.5)")})`
                    : `drop-shadow(0 8px 14px ${store.color.replace(")", " / 0.4)")})`,
                  transition: "filter 0.3s",
                }}
              >
                {/* Clay sphere marker */}
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{
                    background: `radial-gradient(circle at 30% 25%, oklch(1 0 0 / 0.9), ${store.color} 60%, ${store.color.replace(")", " / 0.85)")} 100%)`,
                    border: "3px solid white",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2 L14.5 9 L22 9.5 L16 14 L18 21.5 L12 17 L6 21.5 L8 14 L2 9.5 L9.5 9 Z"
                      fill="white"
                    />
                  </svg>
                </div>
                {/* Stem under marker */}
                <div
                  className="h-3 w-1.5 rounded-b-full"
                  style={{ background: store.color, marginTop: "-2px" }}
                />
              </div>

              {/* Label pill */}
              <div
                className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold tracking-wide transition-all duration-300"
                style={{
                  top: "calc(100% + 6px)",
                  background: "white",
                  color: store.color,
                  border: `2px solid ${store.color}`,
                  boxShadow: isHover
                    ? `0 8px 20px ${store.color.replace(")", " / 0.45)")}`
                    : "0 4px 10px oklch(0.3 0.05 260 / 0.2)",
                  transform: `translateX(-50%) translateY(${isHover ? "2px" : "0"}) scale(${isHover ? 1.08 : 1})`,
                }}
              >
                {store.name}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
