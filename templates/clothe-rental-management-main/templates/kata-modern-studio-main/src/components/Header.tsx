import { Search, ShoppingBag, User, Menu, X, Home, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { label: "Trang chủ", path: "/", icon: Home },
    { label: "Phòng trưng bày", path: "/showroom" },
    { label: "Đặt lịch", path: "/booking" },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "glass-nav shadow-sm" : "bg-transparent"}`}>
      <div className="container mx-auto flex items-center justify-between h-16 px-4 lg:px-8">
        {/* Logo */}
        <Link to="/" className="font-serif text-2xl font-bold tracking-tight text-foreground flex-shrink-0">
          KATA<span className="text-primary">.</span>
        </Link>

        {/* Search Bar - Center */}
        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <div className="flex items-center gap-2 bg-secondary/80 backdrop-blur-sm rounded-full px-4 py-2 w-full border border-border/30 hover:border-primary/30 transition-colors duration-300 group">
            <Search className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Tìm trang phục..."
              className="bg-transparent w-full outline-none text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Nav + Actions */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                location.pathname === item.path
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              {item.icon && <item.icon className="w-4 h-4" />}
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1 ml-2">
          {/* Shortlist/Cart */}
          <Link
            to="/shortlist"
            className="relative flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all duration-300"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden lg:inline">Giỏ hàng</span>
            <span className="absolute -top-0.5 left-6 lg:relative lg:top-auto lg:left-auto bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
              0
            </span>
          </Link>

          {/* Auth */}
          <Link
            to="/auth"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:shadow-lg"
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Đăng nhập</span>
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-full hover:bg-secondary transition-colors"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden px-4 pb-2">
        <div className="flex items-center gap-2 bg-secondary/80 rounded-full px-4 py-2 border border-border/30">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm trang phục..."
            className="bg-transparent w-full outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden overflow-hidden transition-all duration-500 ${menuOpen ? "max-h-80" : "max-h-0"}`}>
        <nav className="container mx-auto px-4 pb-4 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-2 text-sm font-medium py-3 px-3 rounded-xl transition-all duration-300 ${
                location.pathname === item.path
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              {item.icon && <item.icon className="w-4 h-4" />}
              {item.label}
            </Link>
          ))}
          <Link
            to="/shortlist"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 text-sm font-medium py-3 px-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            Giỏ hàng
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
