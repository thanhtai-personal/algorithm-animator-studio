import * as React from "react";
import { cn } from "@/lib/utils";

type LoaderProps = React.HTMLAttributes<HTMLDivElement> & {
  title?: string;
};

const SystemLoader = React.forwardRef<HTMLDivElement, LoaderProps>(({ className, title = "Loading", ...props }, ref) => (
  <div ref={ref} role="img" aria-label={title} className={cn("kai-section-loader", className)} {...props}>
    <span className="sr-only">{title}</span>
    <svg viewBox="0 0 64 72" aria-hidden="true" className="kai-flask-loader">
      <path className="kai-flask-loader-outline" d="M24 6h16a6 6 0 0 1 0 12h-2v20.8c10.3 3 17 11.7 17 22.2 0 3.3-2.7 6-6 6H15c-3.3 0-6-2.7-6-6 0-10.5 6.7-19.2 17-22.2V18h-2a6 6 0 0 1 0-12Z" />
      <path className="kai-flask-loader-water" d="M15 55c3-5 7.6-7.4 13.2-6.3 4.5.9 6.8 3.8 11.8 2.9 3.7-.7 6.7-2.7 9-5.9 2.5 3.8 4 8.6 4 14.2 0 2.2-1.8 4-4 4H15c-2.2 0-4-1.8-4-4 0-1.7.1-3.3.4-4.9H15Z" />
      <circle className="kai-flask-loader-bubble kai-flask-loader-bubble-a" cx="22" cy="53" r="2.3" />
      <circle className="kai-flask-loader-bubble kai-flask-loader-bubble-b" cx="38" cy="47" r="2" />
      <circle className="kai-flask-loader-bubble kai-flask-loader-bubble-c" cx="46" cy="56" r="1.8" />
    </svg>
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
