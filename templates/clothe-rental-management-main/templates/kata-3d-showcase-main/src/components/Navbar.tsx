import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, ShoppingBag, Menu, X, Home, User, Moon, Sun, Settings } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import SettingsPanel from "./SettingsPanel";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const location = useLocation();
  const { t, lang, setLang } = useLanguage();
  const { mode, setMode } = useTheme();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "glass py-2 shadow-lg shadow-background/50"
            : "bg-background/80 backdrop-blur-sm py-3"
        }`}
      >
        <div className="container mx-auto flex items-center justify-between px-4 gap-3">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <span className="text-2xl font-bold tracking-wider text-gradient">KATA</span>
          </Link>

          {/* Search bar - center */}
          <div className="hidden md:flex items-center flex-1 max-w-md">
            <div className="relative w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("nav.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-secondary/50 border border-border/50 rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-secondary/80 transition-all duration-300"
              />
            </div>
          </div>

          {/* Right side actions */}
          <div className="hidden md:flex items-center gap-1">
            {/* Language toggle */}
            <div className="flex items-center bg-secondary/50 rounded-full p-0.5 border border-border/30">
              <button
                onClick={() => setLang("vi")}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
                  lang === "vi"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                VI
              </button>
              <button
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
                  lang === "en"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                EN
              </button>
            </div>

            {/* Dark/Light toggle */}
            <button
              onClick={() => setMode(mode === "dark" ? "light" : "dark")}
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-300"
            >
              {mode === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Settings */}
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-300"
            >
              <Settings size={16} className={`transition-transform duration-500 ${settingsOpen ? "rotate-90" : ""}`} />
            </button>

            {/* Home */}
            <Link
              to="/"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all duration-300 ${
                isActive("/")
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <Home size={14} />
              {t("nav.home")}
            </Link>

            {/* Cart */}
            <Link
              to="/showroom/shortlist"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all duration-300 ${
                isActive("/showroom/shortlist")
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <ShoppingBag size={14} />
              {t("nav.cart")}
              <span className="ml-0.5 w-5 h-5 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-bold">
                0
              </span>
            </Link>

            {/* Login */}
            <Link
              to="/auth"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 px-2"
            >
              {t("nav.login")}
            </Link>
          </div>

          {/* Mobile buttons */}
          <div className="flex md:hidden items-center gap-1">
            {/* Language toggle mobile */}
            <div className="flex items-center bg-secondary/50 rounded-full p-0.5 border border-border/30">
              <button
                onClick={() => setLang("vi")}
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                  lang === "vi" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                VI
              </button>
              <button
                onClick={() => setLang("en")}
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                  lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                EN
              </button>
            </div>

            <button
              onClick={() => setMode(mode === "dark" ? "light" : "dark")}
              className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
            >
              {mode === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
            >
              <Settings size={16} />
            </button>

            <Link to="/showroom/shortlist" className="relative p-1.5 text-muted-foreground hover:text-primary transition-colors">
              <ShoppingBag size={16} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[9px] rounded-full flex items-center justify-center font-bold">
                0
              </span>
            </Link>

            <button
              className="p-1.5 text-foreground"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-500 ${
            menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="glass mx-4 mt-2 rounded-lg p-3 flex flex-col gap-1">
            {/* Mobile search */}
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("nav.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-secondary/50 border border-border/50 rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>

            <Link
              to="/"
              className={`flex items-center gap-2 text-sm py-2.5 px-3 rounded-lg transition-colors ${
                isActive("/") ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-secondary/50"
              }`}
            >
              <Home size={15} />
              {t("nav.home")}
            </Link>
            <Link
              to="/showroom"
              className={`flex items-center gap-2 text-sm py-2.5 px-3 rounded-lg transition-colors ${
                isActive("/showroom") ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-secondary/50"
              }`}
            >
              {t("nav.showroom")}
            </Link>
            <Link
              to="/booking"
              className={`flex items-center gap-2 text-sm py-2.5 px-3 rounded-lg transition-colors ${
                isActive("/booking") ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-secondary/50"
              }`}
            >
              {t("nav.booking")}
            </Link>
            <Link
              to="/auth"
              className="flex items-center gap-2 text-sm py-2.5 px-3 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-colors"
            >
              <User size={15} />
              {t("nav.login")}
            </Link>
          </div>
        </div>
      </nav>

      {/* Settings overlay */}
      {settingsOpen && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[55]" onClick={() => setSettingsOpen(false)} />
      )}
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
};

export default Navbar;
