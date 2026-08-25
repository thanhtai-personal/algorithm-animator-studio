import * as React from "react";

const MOBILE_BREAKPOINT = 768;

function readIsMobileViewport() {
  return typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT;
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(readIsMobileViewport);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(readIsMobileViewport());
    };
    mql.addEventListener("change", onChange);
    onChange();
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
