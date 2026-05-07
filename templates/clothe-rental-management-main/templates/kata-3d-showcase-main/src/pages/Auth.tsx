import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, Eye, EyeOff } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Auth = () => {
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 grain" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-float" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-primary/5 rounded-full blur-[100px] animate-float-delayed" />

      <div className="relative z-10 w-full max-w-4xl grid md:grid-cols-2 gap-0 animate-fade-in">
        <div className="glass rounded-l-2xl md:rounded-r-none rounded-t-2xl md:rounded-tl-2xl md:rounded-bl-2xl p-10 flex flex-col justify-center">
          <span className="inline-block text-xs uppercase tracking-widest text-primary font-medium glass rounded-full px-3 py-1 w-fit mb-6">{t("auth.badge")}</span>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
            {t("auth.title")}
            <br />
            <span className="text-gradient">{t("auth.titleAccent")}</span>
          </h1>
          <p className="text-muted-foreground text-sm mb-8">{t("auth.desc")}</p>
          <div className="bg-secondary/30 rounded-lg p-4 border border-border/30">
            <p className="text-xs text-muted-foreground">{t("auth.note")}</p>
          </div>
        </div>

        <div className="glass rounded-r-2xl md:rounded-l-none rounded-b-2xl md:rounded-tr-2xl md:rounded-br-2xl p-10">
          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground mb-3">{t("auth.method")}</p>
              <div className="flex border border-border/50 rounded-lg overflow-hidden">
                <button onClick={() => setMethod("email")} className={`flex-1 py-2.5 text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${method === "email" ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  <Mail size={14} /> {t("auth.email")}
                </button>
                <button onClick={() => setMethod("phone")} className={`flex-1 py-2.5 text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${method === "phone" ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  <Phone size={14} /> {t("auth.phone")}
                </button>
              </div>
            </div>

            {method === "email" ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-foreground mb-1.5 block">{t("auth.email")}</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-4 py-2.5 bg-secondary/50 border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all" />
                </div>
                <div>
                  <label className="text-sm text-foreground mb-1.5 block">{t("auth.password")}</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-2.5 bg-secondary/50 border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all pr-10" />
                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div className="text-right mt-1.5">
                    <a href="#" className="text-xs text-primary hover:underline">{t("auth.forgotPassword")}</a>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="text-sm text-foreground mb-1.5 block">{t("auth.phone")}</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0909 xxx xxx" className="w-full px-4 py-2.5 bg-secondary/50 border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all" />
              </div>
            )}

            <button className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.5)] transition-all hover:scale-[1.02]">{t("auth.loginBtn")}</button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50" /></div>
              <div className="relative flex justify-center text-xs"><span className="px-3 bg-card text-muted-foreground">{t("auth.or")}</span></div>
            </div>

            <button className="w-full py-3 border border-border/50 rounded-lg text-sm font-medium text-foreground hover:bg-secondary/50 transition-all flex items-center justify-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t("auth.google")}
            </button>

            <div className="text-center space-y-3">
              <p className="text-xs text-muted-foreground">{t("auth.skipNote")}</p>
              <Link to="/" className="block w-full py-3 border border-border/50 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-all">
                {t("auth.skip")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
