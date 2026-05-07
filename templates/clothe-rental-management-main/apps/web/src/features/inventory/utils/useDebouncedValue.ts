"use client";

import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, waitMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setDebounced(value);
    }, waitMs);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [value, waitMs]);

  return debounced;
}
