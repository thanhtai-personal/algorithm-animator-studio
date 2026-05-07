import {
  UtensilsCrossed,
  Car,
  ShoppingBag,
  Gamepad2,
  Heart,
  Receipt,
  GraduationCap,
  MoreHorizontal,
  Wallet,
  Gift,
  TrendingUp,
  Plus,
  Plane,
  Home,
  PiggyBank,
  Coffee,
  Briefcase,
  Sparkles,
  Music4,
  Activity,
  Coins,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/utils';

const iconMap: Record<string, LucideIcon> = {
  UtensilsCrossed,
  Car,
  ShoppingBag,
  Gamepad2,
  Heart,
  Receipt,
  GraduationCap,
  MoreHorizontal,
  Wallet,
  Gift,
  TrendingUp,
  Plus,
  Plane,
  Home,
  PiggyBank,
  Coffee,
  Briefcase,
  Sparkles,
  Music4,
  Activity,
  Coins,
};

interface CategoryIconProps {
  icon: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
};

const iconSizes = {
  sm: 16,
  md: 24,
  lg: 32,
};

export function CategoryIcon({ icon, color, size = 'md', className }: CategoryIconProps) {
  const Icon = iconMap[icon] || MoreHorizontal;
  
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-2xl shadow-2d-sm transition-transform hover:scale-105',
        sizeClasses[size],
        className
      )}
      style={{
        background: `linear-gradient(135deg, hsl(var(--${color})), hsl(var(--${color}) / 0.8))`,
      }}
    >
      <Icon size={iconSizes[size]} className="text-white" strokeWidth={2.5} />
    </div>
  );
}
