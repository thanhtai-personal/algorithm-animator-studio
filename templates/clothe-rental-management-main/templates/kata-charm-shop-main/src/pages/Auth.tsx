import { useState } from "react";
import { Mail, Phone, Eye, EyeOff, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const Auth = () => {
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-0 bg-card rounded-3xl shadow-card overflow-hidden animate-slide-up">
        {/* Left - Info */}
        <div className="gradient-cute p-10 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute w-4 h-4 bg-primary-foreground rounded-full animate-float"
                style={{ left: `${10 + i * 20}%`, top: `${15 + (i % 3) * 30}%`, animationDelay: `${i * 0.7}s` }}
              />
            ))}
          </div>

          <div className="relative z-10">
            <span className="inline-block px-3 py-1 bg-primary-foreground/20 backdrop-blur-sm rounded-full text-xs font-semibold text-primary-foreground mb-4">
              KATA AUTH
            </span>
            <h1 className="text-3xl font-bold text-primary-foreground mb-3">
              Đăng nhập để tiếp tục
            </h1>
            <p className="text-primary-foreground/70 text-sm">
              Lưu dữ liệu chi tiêu của bạn trên cloud
            </p>

            <div className="mt-12 p-4 bg-primary-foreground/10 backdrop-blur-sm rounded-xl">
              <p className="text-primary-foreground/80 text-sm">
                💡 Vui lòng đăng nhập để không mất dữ liệu của bạn
              </p>
            </div>
          </div>
        </div>

        {/* Right - Form */}
        <div className="p-10">
          <p className="text-sm font-semibold text-muted-foreground mb-4">Phương thức đăng nhập</p>

          {/* Method Toggle */}
          <div className="flex bg-muted rounded-xl p-1 mb-6">
            <button
              onClick={() => setMethod("email")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                method === "email"
                  ? "bg-card shadow-sm text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              onClick={() => setMethod("phone")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                method === "phone"
                  ? "bg-card shadow-sm text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Phone className="w-4 h-4" />
              Số điện thoại
            </button>
          </div>

          {method === "email" ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-1.5 p-3 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Mật khẩu</label>
                <div className="relative mt-1.5">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-right mt-1">
                  <button className="text-xs text-primary hover:underline">Quên mật khẩu?</button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium">Số điện thoại</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full mt-1.5 p-3 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                placeholder="0909 123 456"
              />
            </div>
          )}

          <button className="w-full mt-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:scale-[1.02] transition-transform text-sm">
            Đăng nhập
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">hoặc</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button className="w-full py-3 bg-muted rounded-xl font-medium text-sm hover:bg-primary/10 transition-colors flex items-center justify-center gap-2">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Tiếp tục với Google
          </button>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Nếu không đăng nhập, dữ liệu chỉ lưu trên thiết bị
          </p>

          <Link
            to="/"
            className="block w-full mt-3 py-3 bg-muted rounded-xl font-medium text-sm text-center hover:bg-primary/10 transition-colors"
          >
            Bỏ qua đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Auth;
