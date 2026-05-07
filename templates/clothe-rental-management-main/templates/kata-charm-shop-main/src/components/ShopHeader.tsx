import { Search, ShoppingBag, Heart, User, Sparkles, Home, Calendar, Store, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const ShopHeader = () => {
  const [cartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: "/", label: "Trang chủ", icon: Home },
    { to: "/showroom", label: "Phòng trưng bày", icon: Store },
    { to: "/booking", label: "Đặt lịch makeup", icon: Calendar },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <Sparkles className="w-6 h-6 text-primary animate-sparkle group-hover:scale-110 transition-transform" />
          <span className="text-2xl font-bold text-primary">KATA</span>
          <span className="text-accent-script text-xl text-muted-foreground">Shop</span>
        </Link>

        {/* Search */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm trang phục yêu thích..."
              className="w-full pl-10 pr-4 py-2.5 bg-muted rounded-full text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Nav Links - Desktop */}
        <nav className="hidden lg:flex items-center gap-1 mr-4">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                isActive(link.to)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/5"
              }`}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-muted transition-colors group">
            <Heart className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
          <Link to="/cart" className="p-2 rounded-full hover:bg-muted transition-colors relative group">
            <ShoppingBag className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-bold">
              {cartCount}
            </span>
          </Link>
          <Link
            to="/auth"
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:opacity-90 transition-all hover:scale-105"
          >
            <User className="w-4 h-4" />
            Đăng nhập
          </Link>

          {/* Mobile menu toggle */}
          <button
            className="lg:hidden p-2 rounded-full hover:bg-muted transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-card/95 backdrop-blur-md animate-slide-up">
          <nav className="container mx-auto px-4 py-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive(link.to)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
            <Link
              to="/auth"
              onClick={() => setMobileMenuOpen(false)}
              className="sm:hidden flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-primary"
            >
              <User className="w-4 h-4" />
              Đăng nhập
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default ShopHeader;
