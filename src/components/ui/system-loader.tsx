import * as React from "react";
import { cn } from "@/lib/utils";

type SystemLoaderProps = React.HTMLAttributes<HTMLDivElement> & {
  title?: string;
};

const SystemLoader = React.forwardRef<HTMLDivElement, SystemLoaderProps>(({ className, title = "Loading", ...props }, ref) => (
  <div
    ref={ref}
    role="img"
    aria-label={title}
    className={cn("kai-system-loader", className)}
    {...props}
  >
    <span className="sr-only">{title}</span>
    <span className="kai-system-loader-glow kai-system-loader-glow-a" />
    <span className="kai-system-loader-glow kai-system-loader-glow-b" />
    <span className="kai-system-loader-curve kai-system-loader-curve-a" />
    <span className="kai-system-loader-curve kai-system-loader-curve-b" />
    <span className="kai-system-loader-core" />
  </div>
));
SystemLoader.displayName = "SystemLoader";

export { SystemLoader };
