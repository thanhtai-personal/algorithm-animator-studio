"use client";

import styles from "./RectangleGlowingBackground.module.css";

export function RectangleGlowingBackground() {
  return (
    <div className={styles.bgAnimationContainer} aria-hidden="true">
      <ul className={styles.circles}>
        {Array.from({ length: 10 }).map((_, idx) => (
          <li key={idx} />
        ))}
      </ul>
    </div>
  );
}
