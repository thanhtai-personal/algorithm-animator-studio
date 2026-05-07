"use client";

import React from "react";
import clsx from "clsx";
import styles from "./ElectricBorder.module.css";

type ElectricBorderProps = {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

/**
 * ElectricBorder - animated neon border wrapper.
 * Accepts arbitrary children; animations are pure CSS/SVG (no JS timers).
 */
export function ElectricBorder({
  children,
  className,
  contentClassName,
}: ElectricBorderProps) {
  return (
    <div className={clsx(styles.wrapper, className)}>
      <svg className={styles.hiddenSvg} aria-hidden="true">
        <defs>
          <filter
            id="turbulent-displace"
            colorInterpolationFilters="sRGB"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise1" seed="1" />
            <feOffset in="noise1" dx="0" dy="0" result="offsetNoise1">
              <animate attributeName="dy" values="700; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
            </feOffset>

            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise2" seed="1" />
            <feOffset in="noise2" dx="0" dy="0" result="offsetNoise2">
              <animate attributeName="dy" values="0; -700" dur="6s" repeatCount="indefinite" calcMode="linear" />
            </feOffset>

            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise1" seed="2" />
            <feOffset in="noise1" dx="0" dy="0" result="offsetNoise3">
              <animate attributeName="dx" values="490; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
            </feOffset>

            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise2" seed="2" />
            <feOffset in="noise2" dx="0" dy="0" result="offsetNoise4">
              <animate attributeName="dx" values="0; -490" dur="6s" repeatCount="indefinite" calcMode="linear" />
            </feOffset>

            <feComposite in="offsetNoise1" in2="offsetNoise2" result="part1" />
            <feComposite in="offsetNoise3" in2="offsetNoise4" result="part2" />
            <feBlend in="part1" in2="part2" mode="color-dodge" result="combinedNoise" />

            <feDisplacementMap
              in="SourceGraphic"
              in2="combinedNoise"
              scale="30"
              xChannelSelector="R"
              yChannelSelector="B"
            />
          </filter>
        </defs>
      </svg>

      <div className={styles.cardContainer}>
        <div className={styles.innerContainer}>
          <div className={styles.borderOuter}>
            <div className={styles.mainCard} />
          </div>
          <div className={styles.glowLayer1} />
          <div className={styles.glowLayer2} />
        </div>

        <div className={styles.overlay1} aria-hidden="true" />
        <div className={styles.overlay2} aria-hidden="true" />
        <div className={styles.backgroundGlow} aria-hidden="true" />

        <div className={clsx(styles.contentContainer, contentClassName)}>{children}</div>
      </div>
    </div>
  );
}

export default ElectricBorder;
