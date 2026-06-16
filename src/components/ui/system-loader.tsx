import * as React from "react";
import { cn } from "@/lib/utils";

type SystemLoaderProps = React.SVGAttributes<SVGSVGElement> & {
  title?: string;
};

const SystemLoader = React.forwardRef<SVGSVGElement, SystemLoaderProps>(({ className, title = "Loading", ...props }, ref) => (
  <svg
    ref={ref}
    viewBox="0 0 96 48"
    role="img"
    aria-label={title}
    className={cn("kai-system-loader", className)}
    {...props}
  >
    <title>{title}</title>
    <path className="kai-system-loader-orbit kai-system-loader-orbit-soft" pathLength="1" d="M18 24c10-18 22-18 30 0s20 18 30 0" />
    <path className="kai-system-loader-orbit kai-system-loader-orbit-soft" pathLength="1" d="M18 24c10 18 22 18 30 0s20-18 30 0" />
    <path className="kai-system-loader-orbit kai-system-loader-orbit-main" pathLength="1" d="M18 24c10-18 22-18 30 0s20 18 30 0" />
    <path className="kai-system-loader-orbit kai-system-loader-orbit-main kai-system-loader-delay" pathLength="1" d="M18 24c10 18 22 18 30 0s20-18 30 0" />
    <circle className="kai-system-loader-pulse kai-system-loader-pulse-a" cx="18" cy="24" r="3.2" />
    <circle className="kai-system-loader-pulse kai-system-loader-pulse-b" cx="78" cy="24" r="3.2" />
  </svg>
));
SystemLoader.displayName = "SystemLoader";

export { SystemLoader };
