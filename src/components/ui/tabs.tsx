import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, children, ...props }, ref) => {
  const listRef = React.useRef<React.ElementRef<typeof TabsPrimitive.List> | null>(null);
  const [indicator, setIndicator] = React.useState({ left: 4, width: 0, ready: false });

  const setRefs = React.useCallback((node: React.ElementRef<typeof TabsPrimitive.List> | null) => {
    listRef.current = node;
    if (typeof ref === "function") {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  }, [ref]);

  const updateIndicator = React.useCallback(() => {
    const list = listRef.current;
    const active = list?.querySelector<HTMLElement>('[data-state="active"]');
    if (!list || !active) return;

    setIndicator({
      left: active.offsetLeft,
      width: active.offsetWidth,
      ready: true,
    });
  }, []);

  React.useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    updateIndicator();
    const frame = window.requestAnimationFrame(updateIndicator);
    const resizeObserver = new ResizeObserver(updateIndicator);
    const mutationObserver = new MutationObserver(updateIndicator);

    resizeObserver.observe(list);
    Array.from(list.children).forEach((child) => resizeObserver.observe(child));
    mutationObserver.observe(list, {
      attributes: true,
      attributeFilter: ["data-state", "class", "style"],
      childList: true,
      subtree: true,
    });
    window.addEventListener("resize", updateIndicator);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", updateIndicator);
    };
  }, [children, updateIndicator]);

  return (
    <TabsPrimitive.List
      ref={setRefs}
      className={cn(
        "tabs-list-animated relative inline-flex h-10 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-muted/70 p-1 text-muted-foreground shadow-inner shadow-black/5",
        className,
      )}
      {...props}
    >
      <span
        className="tabs-active-indicator"
        style={{
          opacity: indicator.ready ? 1 : 0,
          transform: `translateX(${indicator.left}px)`,
          width: `${indicator.width}px`,
        }}
      />
      {children}
    </TabsPrimitive.List>
  );
});
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "relative z-10 inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-semibold ring-offset-background transition-all duration-200 hover:text-foreground data-[state=active]:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
