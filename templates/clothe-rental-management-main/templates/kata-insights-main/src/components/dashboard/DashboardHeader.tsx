import { MapPin, ChevronDown } from "lucide-react";

interface DashboardHeaderProps {
  branch: string;
  period: string;
}

const DashboardHeader = ({ branch, period }: DashboardHeaderProps) => {
  return (
    <div className="px-4 pt-4 pb-2">
      <h1 className="text-lg font-bold text-foreground leading-tight">
        Tổng quan doanh thu & vận hành
      </h1>
      <div className="flex items-center gap-3 mt-1.5">
        <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <MapPin className="w-3.5 h-3.5" />
          <span>{branch}</span>
          <ChevronDown className="w-3 h-3" />
        </button>
        <span className="text-border">|</span>
        <span className="text-sm text-muted-foreground">{period}</span>
      </div>
    </div>
  );
};

export default DashboardHeader;
