import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { LayoutDashboard, Package, Warehouse, ShoppingBag, Users, CreditCard, BarChart3, Settings, Menu, Search, ChevronDown, Bell, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PaletteSelect } from '@/components/PaletteSelect';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/products', icon: Package, label: 'Sản phẩm' },
  { to: '/admin/inventory', icon: Warehouse, label: 'Kho hàng' },
  { to: '/admin/orders', icon: ShoppingBag, label: 'Đơn hàng' },
  { to: '/admin/customers', icon: Users, label: 'Khách hàng' },
  { to: '/admin/payments', icon: CreditCard, label: 'Thanh toán' },
  { to: '/admin/reports', icon: BarChart3, label: 'Báo cáo' },
  { to: '/admin/settings', icon: Settings, label: 'Cài đặt' },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  const sidebarWidth = collapsed && !isMobile ? 'w-16' : 'w-64';
  const showLabels = !collapsed || isMobile;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'bg-card border-r border-border flex flex-col transition-all duration-300 z-50',
        isMobile ? 'fixed inset-y-0 left-0 w-64 shadow-xl' : `sticky top-0 h-screen ${sidebarWidth}`,
        isMobile && !mobileOpen && '-translate-x-full'
      )}>
        <div className="h-14 flex items-center justify-between px-4 border-b border-border shrink-0">
          {showLabels && <span className="font-bold text-lg text-foreground tracking-tight">RentaFash</span>}
          <button onClick={() => isMobile ? setMobileOpen(false) : setCollapsed(!collapsed)} className="p-1.5 rounded-lg hover:bg-accent text-foreground">
            {isMobile ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => isMobile && setMobileOpen(false)}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {showLabels && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-border shrink-0 space-y-2">
          <NavLink to="/sales" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors font-medium">
            <span className="w-2 h-2 rounded-full bg-warning" />
            {showLabels && <span>POS Bán hàng →</span>}
          </NavLink>
          <NavLink to="/showroom" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
            <span className="w-2 h-2 rounded-full bg-success" />
            {showLabels && <span>Mở Showroom →</span>}
          </NavLink>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-accent text-foreground">
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-accent rounded-lg px-3 py-1.5 cursor-pointer hover:bg-accent/80 transition-colors">
              <span>Chi nhánh: HCM - Q1</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input placeholder="Tìm kiếm..." className="pl-9 pr-4 py-1.5 bg-accent rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring w-64 border-0" />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <PaletteSelect />
            <button className="p-2 rounded-lg hover:bg-accent text-muted-foreground relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold ml-1">
              A
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
