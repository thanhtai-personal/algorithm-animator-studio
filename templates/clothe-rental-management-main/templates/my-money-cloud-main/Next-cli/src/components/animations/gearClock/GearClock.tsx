"use client";

import { useEffect, useState, type CSSProperties } from "react";

import { cn } from "@/utils";

import styles from "./GearClock.module.css";

const TICKS = Array.from({ length: 60 }, (_, index) => index);
const STANDARD_GEAR_PEGS = Array.from({ length: 9 }, (_, index) => index);
const SMALL_GEAR_PEGS = Array.from({ length: 7 }, (_, index) => index);
const LARGE_GEAR_PEGS = Array.from({ length: 12 }, (_, index) => index);
const HOLLOW_GEAR_PEGS = Array.from({ length: 11 }, (_, index) => index);

const STANDARD_STEP = 360 / STANDARD_GEAR_PEGS.length;
const SMALL_STEP = 360 / SMALL_GEAR_PEGS.length;
const LARGE_STEP = 360 / LARGE_GEAR_PEGS.length;
const HOLLOW_STEP = 360 / HOLLOW_GEAR_PEGS.length;

type ClockAngles = {
  hour: number;
  minute: number;
  second: number;
};

const getClockAngles = (date: Date): ClockAngles => {
  const milliseconds = date.getMilliseconds();
  const seconds = date.getSeconds() + milliseconds / 1000;
  const minutes = date.getMinutes() + seconds / 60;
  const hours = (date.getHours() % 12) + minutes / 60;
  return {
    hour: hours * 30,
    minute: minutes * 6,
    second: seconds * 6,
  };
};

export interface GearClockColors {
  border?: string;
  faceStart?: string;
  faceEnd?: string;
  primary?: string;
  secondary?: string;
  tertiary?: string;
  hollow?: string;
}

interface GearClockProps {
  className?: string;
  size?: number | string;
  colors?: GearClockColors;
  useTrueTime?: boolean;
  showSecondHand?: boolean;
}

export function GearClock({ className, size, colors, useTrueTime = false, showSecondHand }: GearClockProps) {
  const [angles, setAngles] = useState<ClockAngles>(() => getClockAngles(new Date()));
  const sizeStyle = size
    ? ({ ["--gear-size" as const]: typeof size === "number" ? `${size}px` : size } as CSSProperties)
    : undefined;
  const colorStyle = colors
    ? ({
        ...(colors.border ? { ["--gear-border" as const]: colors.border } : {}),
        ...(colors.faceStart ? { ["--gear-face-start" as const]: colors.faceStart } : {}),
        ...(colors.faceEnd ? { ["--gear-face-end" as const]: colors.faceEnd } : {}),
        ...(colors.primary ? { ["--gear-primary" as const]: colors.primary } : {}),
        ...(colors.secondary ? { ["--gear-secondary" as const]: colors.secondary } : {}),
        ...(colors.tertiary ? { ["--gear-tertiary" as const]: colors.tertiary } : {}),
        ...(colors.hollow ? { ["--gear-hollow" as const]: colors.hollow } : {}),
      } as CSSProperties)
    : undefined;
  const mergedStyle = sizeStyle ? { ...sizeStyle, ...colorStyle } : colorStyle;

  const shouldShowSecondHand = typeof showSecondHand === "boolean" ? showSecondHand : useTrueTime;
  const hourStyle = useTrueTime ? ({ transform: `rotate(${angles.hour}deg)` } as CSSProperties) : undefined;
  const minuteStyle = useTrueTime ? ({ transform: `rotate(${angles.minute}deg)` } as CSSProperties) : undefined;
  const secondStyle = useTrueTime ? ({ transform: `rotate(${angles.second}deg)` } as CSSProperties) : undefined;

  useEffect(() => {
    if (!useTrueTime) return;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const update = () => {
      setAngles(getClockAngles(new Date()));
    };

    update();
    const delay = 1000 - (Date.now() % 1000);
    timeoutId = setTimeout(() => {
      update();
      intervalId = setInterval(update, 1000);
    }, delay);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [useTrueTime]);

  return (
    <div className={cn(styles.gearClock, className)} style={mergedStyle} aria-hidden="true">
      <div className={styles.clock}>
        <div className={styles.clockBorder}>
          <div className={styles.inner}>
            {TICKS.map((tick) => (
              <span
                key={tick}
                className={styles.tick}
                style={{ transform: `rotate(${(tick + 1) * 6}deg) translateX(var(--gear-tick-radius))` }}
              />
            ))}
          </div>
          <div className={styles.centerPoint} />
        </div>
        <div className={styles.clockFace}>
          <div className={styles.gearStandard}>
            {STANDARD_GEAR_PEGS.map((peg) => (
              <span key={peg} className={styles.gearPeg} style={{ transform: `rotate(${(peg + 1) * STANDARD_STEP}deg)` }} />
            ))}
          </div>
          <div className={styles.gearSmall}>
            {SMALL_GEAR_PEGS.map((peg) => (
              <span key={peg} className={styles.gearPeg} style={{ transform: `rotate(${(peg + 1) * SMALL_STEP}deg)` }} />
            ))}
          </div>
          <div className={styles.gearLarge}>
            {LARGE_GEAR_PEGS.map((peg) => (
              <span
                key={peg}
                className={styles.gearPegLarge}
                style={{ transform: `rotate(${(peg + 1) * LARGE_STEP}deg)` }}
              />
            ))}
          </div>
          <div className={styles.gearXLarge}>
            {LARGE_GEAR_PEGS.map((peg) => (
              <span
                key={peg}
                className={styles.gearPegLarge}
                style={{ transform: `rotate(${(peg + 1) * LARGE_STEP}deg)` }}
              />
            ))}
          </div>
          <div className={styles.gearHollowMedium}>
            {HOLLOW_GEAR_PEGS.map((peg) => (
              <span
                key={peg}
                className={styles.gearPegOrbit}
                style={{ transform: `rotate(${(peg + 1) * HOLLOW_STEP}deg) translateX(var(--gear-hollow-medium-radius))` }}
              />
            ))}
          </div>
          <div className={styles.gearHollowLarge}>
            {HOLLOW_GEAR_PEGS.map((peg) => (
              <span
                key={peg}
                className={styles.gearPegOrbit}
                style={{ transform: `rotate(${(peg + 1) * HOLLOW_STEP}deg) translateX(var(--gear-hollow-large-radius))` }}
              />
            ))}
          </div>
          <div className={cn(styles.largeHand, useTrueTime && styles.handStatic)} style={hourStyle} />
          <div className={cn(styles.smallHand, useTrueTime && styles.handStatic)} style={minuteStyle} />
          {shouldShowSecondHand ? (
            <div className={cn(styles.secondHand, useTrueTime && styles.handStatic)} style={secondStyle} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
