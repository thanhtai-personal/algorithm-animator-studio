import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useSystemLang } from "@/hooks/use-system-lang";
import { text } from "@/lib/i18n";

const NotFound = () => {
  const location = useLocation();
  const lang = useSystemLang();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">{text(lang, "Oops! Page not found", "Không tìm thấy trang")}</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          {text(lang, "Return to Home", "Về trang chủ")}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
