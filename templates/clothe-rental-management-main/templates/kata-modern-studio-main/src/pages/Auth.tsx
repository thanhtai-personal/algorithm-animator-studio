import { useState } from "react";
import { Mail, Phone, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Auth = () => {
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
        {/* Left - Branding */}
        <div className="glass-card p-10 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground border border-border rounded-full px-3 py-1">
              KATA AUTH
            </span>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mt-6 mb-3">
              Đăng nhập để tiếp tục
            </h1>
            <p className="text-muted-foreground">
              Lưu dữ liệu chỉ tiêu của bạn trên cloud
            </p>
          </div>
          <p className="text-sm text-muted-foreground mt-auto pt-8">
            Vui lòng đăng nhập để không mất dữ liệu của bạn
          </p>
        </div>

        {/* Right - Form */}
        <div className="glass-card p-8">
          {/* Method Toggle */}
          <div className="mb-6">
            <p className="text-sm font-medium text-foreground mb-3">Phương thức đăng nhập</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMethod("email")}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  method === "email"
                    ? "bg-primary/10 text-primary border-2 border-primary/30"
                    : "bg-secondary text-muted-foreground border-2 border-transparent hover:border-border"
                }`}
              >
                <Mail className="w-4 h-4" /> Email
              </button>
              <button
                onClick={() => setMethod("phone")}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  method === "phone"
                    ? "bg-primary/10 text-primary border-2 border-primary/30"
                    : "bg-secondary text-muted-foreground border-2 border-transparent hover:border-border"
                }`}
              >
                <Phone className="w-4 h-4" /> Số điện thoại
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {method === "email" ? (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-secondary/50 rounded-xl px-4 py-3 text-sm outline-none border border-border/50 focus:border-primary/50 transition-colors"
                />
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Số điện thoại</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0909 xxx xxx"
                  className="w-full bg-secondary/50 rounded-xl px-4 py-3 text-sm outline-none border border-border/50 focus:border-primary/50 transition-colors"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-secondary/50 rounded-xl px-4 py-3 pr-12 text-sm outline-none border border-border/50 focus:border-primary/50 transition-colors"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="text-right mt-2">
                <button className="text-xs text-primary hover:underline">Quên mật khẩu?</button>
              </div>
            </div>

            <button className="w-full btn-primary-glow flex items-center justify-center gap-2 text-sm !py-3">
              Đăng nhập <ArrowRight className="w-4 h-4" />
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">hoặc</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Google */}
            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border border-border hover:bg-secondary transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Tiếp tục với Google
            </button>

            <p className="text-xs text-center text-muted-foreground">
              Nếu không đăng nhập, dữ liệu chỉ lưu trên thiết bị
            </p>

            <Link
              to="/"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border border-border hover:bg-secondary transition-colors"
            >
              Bỏ qua đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
