import { Outlet, Link, useLocation } from 'react-router-dom';
import { Search, Heart, Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PaletteSelect } from '@/components/PaletteSelect';
import { useShortlist } from '@/contexts/ShortlistContext';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function ShowroomLayout() {
  const { count } = useShortlist();
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/showroom" className="font-bold text-xl text-foreground tracking-tight">
            Renta<span className="text-primary">Fash</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input placeholder="Tìm trang phục..." className="pl-9 pr-4 py-1.5 bg-accent rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring w-64 border-0" />
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={() => setSearchOpen(!searchOpen)} className="md:hidden p-2 rounded-lg hover:bg-accent text-muted-foreground">
              <Search className="w-5 h-5" />
            </button>
            <ThemeToggle />
            <PaletteSelect />
            <Link to="/showroom/shortlist" className="relative p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors">
              <Heart className={cn("w-5 h-5", count > 0 && "fill-primary text-primary")} />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </Link>
            <Link to="/admin/dashboard" className="text-xs text-muted-foreground hover:text-primary ml-2 hidden sm:block">
              Admin →
            </Link>
          </div>
        </div>

        {/* Mobile search */}
        {searchOpen && (
          <div className="md:hidden px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input autoFocus placeholder="Tìm trang phục..." className="w-full pl-9 pr-4 py-2 bg-accent rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring border-0" />
            </div>
          </div>
        )}
      </header>

      <main className="animate-fade-in">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 RentaFash. Hệ thống thuê quần áo thời trang.
        </div>
      </footer>
    </div>
  );
}
