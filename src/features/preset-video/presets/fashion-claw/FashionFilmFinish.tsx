import { AbsoluteFill } from "remotion";
import { getFashionVisualState } from "./fashionVisualStyle";

/** A softly blurred, model-locked ground shadow that moves with the model. */
export function FashionContactShadow({ seconds, modelTransform }: {seconds: number; modelTransform: string}) {
  const visual = getFashionVisualState(seconds);
  return (
    <AbsoluteFill style={{ transform: modelTransform, transformOrigin: "50% 51%", pointerEvents: "none" }}>
      <svg width="100%" height="100%" viewBox="0 0 360 640" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <filter id="fashion-contact-soft" x="-50%" y="-25%" width="200%" height="150%">
            <feGaussianBlur stdDeviation="13" />
          </filter>
        </defs>
        <ellipse cx="195" cy="354" rx="79" ry="186" fill="#152b3a" opacity={visual.shadowOpacity}
          filter="url(#fashion-contact-soft)" transform="translate(5 10)" />
      </svg>
    </AbsoluteFill>
  );
}

/** Stable color grade and a restrained four-frame light veil at fan-masked cuts. */
export function FashionFilmFinish({ seconds }: { seconds: number }) {
  const visual = getFashionVisualState(seconds);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{
        opacity: visual.vignetteOpacity,
        background: "radial-gradient(ellipse at 51% 48%, transparent 32%, rgba(9,23,34,.86) 100%)",
      }} />
      {visual.transitionVeil > 0 ? (
        <AbsoluteFill style={{
          opacity: visual.transitionVeil,
          background: "linear-gradient(95deg, rgba(243,223,201,.15), rgba(255,244,223,.62) 48%, rgba(191,219,226,.14))",
        }} />
      ) : null}
    </AbsoluteFill>
  );
}
