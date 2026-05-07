"use client";

import { cn } from "@/utils";
import type { ReactNode } from "react";

type FormRootProps = {
  children: ReactNode;
  className?: string;
};

type FormSectionProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

type FormActionsProps = {
  children: ReactNode;
  className?: string;
};

const Root = ({ children, className }: FormRootProps) => (
  <div className={cn("space-y-6", className)}>{children}</div>
);

const Section = ({ title, description, action, children, className, contentClassName }: FormSectionProps) => (
  <section className={cn("rounded-2xl border border-border/60 bg-background/60 p-4 shadow-sm", className)}>
    {(title || description || action) && (
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="space-y-1">
          {title ? <p className="text-sm font-semibold">{title}</p> : null}
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
    )}
    <div className={contentClassName}>{children}</div>
  </section>
);

const Actions = ({ children, className }: FormActionsProps) => (
  <div className={cn("flex flex-col gap-3", className)}>{children}</div>
);

export const Form = {
  Root,
  Section,
  Actions,
};
