import { FormEvent, useState } from "react";
import { LockKeyhole, LogIn } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { SystemLoader } from "@/components/ui/system-loader";
import { clearAuthTokens, isSuperAdminProfile, signInWithPassword } from "@/lib/auth";
import { useSystemLang } from "@/hooks/use-system-lang";
import { t } from "@/lib/i18n";

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
        toast.error(t(lang, "uiThisAccountDoesNotHaveAccessToAnimation"));
        return;
      }

      navigate(state?.from ?? "/", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t(lang, "uiLoginFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page relative min-h-screen overflow-hidden bg-background px-5 py-10 text-foreground">
      <div className="auth-aura" aria-hidden="true" />
      <div className="auth-grid mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="auth-hero hidden min-w-0 lg:block">
          <div className="auth-orbit" aria-hidden="true" />
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-primary">KAI STUDIO</p>
          <h1 className="mt-5 max-w-xl text-5xl font-black leading-tight tracking-tight">
            {t(lang, "uiAnimationStudio")}
          </h1>
          <p className="mt-5 max-w-md text-base text-muted-foreground">
            {t(lang, "uiSecureOwnerWorkspaceForLocalCreativeAutomation")}
          </p>
        </section>

        <section className="auth-card mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-8 flex items-center gap-3">
            <div className="auth-lock flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">{t(lang, "uiSignIn")}</h2>
              <p className="text-sm text-muted-foreground">{t(lang, "uiOwnerAccess")}</p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">{t(lang, "uiEmail")}</Label>
              <Input id="email" autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t(lang, "uiPassword")}</Label>
              <Input id="password" autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </div>
            <Button className="w-full" disabled={loading} type="submit">
              {loading ? <SystemLoader className="h-4 w-5" /> : <LogIn className="h-4 w-4" />}
              {loading ? t(lang, "uiSigningIn") : t(lang, "uiSignIn")}
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
