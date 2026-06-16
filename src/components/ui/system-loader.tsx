import * as React from "react";
import { Loader2 } from "lucide-react";
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

const PageLoader = React.forwardRef<HTMLDivElement, LoaderProps>(({ className, title = "Loading", ...props }, ref) => (
  <div ref={ref} role="status" aria-live="polite" aria-label={title} className={cn("kai-page-loader", className)} {...props}>
    <div className="kai-page-loader-orb">
      <Loader2 className="kai-page-loader-icon" aria-hidden="true" />
      <SystemLoader className="h-12 w-12 text-cyan-300" title={title} />
    </div>
    <span className="mt-4 text-sm font-medium tracking-[0.22em] text-muted-foreground">{title}</span>
  </div>
));
PageLoader.displayName = "PageLoader";

export { PageLoader, SectionLoader, SystemLoader };
