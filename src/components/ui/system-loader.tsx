import * as React from "react";
import { cn } from "@/lib/utils";

type LoaderProps = React.HTMLAttributes<HTMLDivElement> & {
  title?: string;
};

const SystemLoader = React.forwardRef<HTMLDivElement, LoaderProps>(({ className, title = "Loading", ...props }, ref) => (
  <div ref={ref} role="img" aria-label={title} className={cn("kai-section-loader", className)} {...props}>
    <span className="sr-only">{title}</span>
    <span className="kai-section-loader-dot kai-section-loader-dot-a" />
    <span className="kai-section-loader-dot kai-section-loader-dot-b" />
  </div>
));
SystemLoader.displayName = "SystemLoader";

const SectionLoader = SystemLoader;

const InfinityLoader = React.forwardRef<SVGSVGElement, React.SVGAttributes<SVGSVGElement>>(({ className, ...props }, ref) => (
  <svg
    ref={ref}
    viewBox="0 0 220 120"
    aria-hidden="true"
    className={cn("kai-infinity-loader", className)}
    {...props}
  >
    <path
      className="kai-infinity-loader-track"
      pathLength="100"
      d="M110 60 C82 18 34 18 34 60 C34 102 82 102 110 60 C138 18 186 18 186 60 C186 102 138 102 110 60"
    />
    <path
      className="kai-infinity-loader-segment kai-infinity-loader-segment-a"
      pathLength="100"
      d="M110 60 C82 18 34 18 34 60 C34 102 82 102 110 60 C138 18 186 18 186 60 C186 102 138 102 110 60"
    />
    <path
      className="kai-infinity-loader-segment kai-infinity-loader-segment-b"
      pathLength="100"
      d="M110 60 C82 18 34 18 34 60 C34 102 82 102 110 60 C138 18 186 18 186 60 C186 102 138 102 110 60"
    />
    <path
      className="kai-infinity-loader-segment kai-infinity-loader-segment-c"
      pathLength="100"
      d="M110 60 C82 18 34 18 34 60 C34 102 82 102 110 60 C138 18 186 18 186 60 C186 102 138 102 110 60"
    />
  </svg>
));
InfinityLoader.displayName = "InfinityLoader";

const PageLoader = React.forwardRef<HTMLDivElement, LoaderProps>(({ className, title = "Loading", ...props }, ref) => (
  <div ref={ref} role="status" aria-live="polite" aria-label={title} className={cn("kai-page-loader", className)} {...props}>
    <div className="kai-page-loader-orb">
      <InfinityLoader />
    </div>
    <span className="mt-4 text-sm font-medium tracking-[0.22em] text-muted-foreground">{title}</span>
  </div>
));
PageLoader.displayName = "PageLoader";

export { InfinityLoader, PageLoader, SectionLoader, SystemLoader };
