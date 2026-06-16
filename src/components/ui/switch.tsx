import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "kai-switch peer relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center overflow-hidden rounded-full border border-transparent px-0.5 transition-all duration-300 data-[state=checked]:border-emerald-400/50 data-[state=checked]:bg-emerald-500 data-[state=unchecked]:border-border/70 data-[state=unchecked]:bg-muted-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "switch-thumb-indicator pointer-events-none relative z-10 block h-6 w-6 rounded-full bg-background shadow-lg ring-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-[state=checked]:translate-x-7 data-[state=unchecked]:translate-x-0",
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
