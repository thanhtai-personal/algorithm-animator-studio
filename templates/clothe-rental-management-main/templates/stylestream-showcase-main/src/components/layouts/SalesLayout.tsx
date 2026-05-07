import { Outlet, NavLink } from 'react-router-dom';
import { ShoppingCart, PackageCheck, Search, ArrowLeft, ReceiptText } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PaletteSelect } from '@/components/PaletteSelect';
import { cn } from '@/lib/utils';

const tabs = [
  { to: '/sales/pos', icon: ShoppingCart, label: 'Tạo đơn' },
  { to: '/sales/returns', icon: PackageCheck, label: 'Trả hàng' },
  { to: '/sales/stock', icon: Search, label: 'Tồn kho' },
  { to: '/sales/invoices', icon: ReceiptText, label: 'Hóa đơn' },
];

export default function SalesLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top bar */}
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <NavLink to="/admin/dashboard" className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </NavLink>
          <span className="font-bold text-lg text-foreground tracking-tight">POS Bán hàng</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:block">NV: Ngọc Anh</span>
          <ThemeToggle />
          <PaletteSelect />
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
            N
          </div>
        </div>
      </header>

      {/* Tab nav */}
      <nav className="bg-card border-b border-border flex gap-1 px-4 shrink-0">
        {tabs.map(t => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) => cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <t.icon className="w-4 h-4" />
            <span>{t.label}</span>
          </NavLink>
        ))}
      </nav>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
