import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionBlockProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

const SectionBlock = ({ title, icon, children, className, action }: SectionBlockProps) => {
  return (
    <div className={cn("px-4 py-3", className)}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          {icon}
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
};

export default SectionBlock;
