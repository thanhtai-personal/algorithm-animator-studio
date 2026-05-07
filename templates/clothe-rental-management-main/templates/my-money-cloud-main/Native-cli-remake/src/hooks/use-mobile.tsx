import { useEffect, useState } from "react";
import { Dimensions } from "react-native";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean>(true);

  useEffect(() => {
    const update = ({ window }: { window: { width: number } }) => {
      setIsMobile(window.width < MOBILE_BREAKPOINT);
    };
    const subscription = Dimensions.addEventListener("change", update);
    update({ window: Dimensions.get("window") });
    return () => {
      subscription?.remove();
    };
  }, []);

  return isMobile;
}
