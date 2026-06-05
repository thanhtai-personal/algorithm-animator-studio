import { FormEvent, useState } from "react";
import { LockKeyhole, LogIn } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { clearAuthTokens, isSuperAdminProfile, signInWithPassword } from "@/lib/auth";
import { useSystemLang } from "@/hooks/use-system-lang";
import { text } from "@/lib/i18n";

type LocationState = {
  from?: string;
};

export default function Auth() {
  const lang = useSystemLang();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const profile = await signInWithPassword({ email, password });
      if (!isSuperAdminProfile(profile)) {
        clearAuthTokens();
        toast.error(text(lang, "This account does not have access to Animation Studio.", "Tài khoản này không có quyền truy cập Animation Studio."));
        return;
      }

      navigate(state?.from ?? "/", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text(lang, "Login failed.", "Đăng nhập thất bại."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{text(lang, "Animation Studio", "Animation Studio")}</h1>
            <p className="text-sm text-muted-foreground">{text(lang, "Sign in with the owner_admin account.", "Đăng nhập bằng tài khoản owner_admin.")}</p>
          </div>
        </div>

        <div className="mb-4 rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
          {text(lang, "Tip: An admin account is required to use tool configuration features.", "Tip: Cần đăng nhập tài khoản admin để sử dụng các tính năng cấu hình của tools.")}
        </div>

        <form className="space-y-5 rounded-lg border border-border bg-card p-5 shadow-sm" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">{text(lang, "Email", "Email")}</Label>
            <Input
              id="email"
              autoComplete="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{text(lang, "Password", "Mật khẩu")}</Label>
            <Input
              id="password"
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <Button className="w-full" disabled={loading} type="submit">
            <LogIn className="h-4 w-4" />
            {loading ? text(lang, "Signing in...", "Đang đăng nhập...") : text(lang, "Sign in", "Đăng nhập")}
          </Button>
        </form>
      </div>
    </main>
  );
}
