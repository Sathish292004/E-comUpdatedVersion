import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/lib/store/AppContext";
import { toast } from "sonner";
import { login as apiLogin } from "@/lib/api/auth";
import { AUTH_TOKEN_KEY, AUTH_PROVIDER_KEY, API_BASE_URL } from "@/lib/api/client";

export const Route = createFileRoute("/auth/login")({
  head: () => ({ meta: [{ title: "Sign in — SK" }] }),
  component: Login,
});

function Login() {
  const { login } = useApp();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || pw.length < 4) { toast.error("Check your details"); return; }
    setBusy(true);
    try {
      const { user, token } = await apiLogin(email, pw);
      window.localStorage.setItem(AUTH_TOKEN_KEY, token);
      window.localStorage.setItem(AUTH_PROVIDER_KEY, "local");
      login(user);
      toast.success("Signed in");
      nav({ to: user.role === "admin" ? "/admin" : "/account" });
    } catch (err) {
      toast.error((err as { message?: string })?.message || "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  const googleUrl = (() => {
    try {
      const origin = new URL(API_BASE_URL, window.location.origin).origin;
      return `${origin}/oauth2/authorization/google`;
    } catch {
      return "/oauth2/authorization/google";
    }
  })();

  return (
    <>
      <h1 className="text-3xl font-black">Sign in</h1>
      <p className="mt-1 text-sm text-muted-foreground">Welcome back. Let's pick up where you left off.</p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <Field icon={<Mail className="h-4 w-4" />} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" required />
        <Field
          icon={<Lock className="h-4 w-4" />}
          type={showPw ? "text" : "password"}
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Password"
          required
          trailing={
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
              className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />
        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2"><input type="checkbox" className="accent-indigo" />Remember me</label>
          <Link to="/auth/forgot" className="font-semibold text-indigo hover:underline">Forgot password?</Link>
        </div>
        <button disabled={busy} className="mt-2 w-full rounded-full bg-gradient-cta px-5 py-3 text-sm font-bold text-white shadow-glow transition hover:scale-[1.01] disabled:opacity-60">{busy ? "Signing in…" : "Sign in"}</button>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" /> or continue with <div className="h-px flex-1 bg-border" /></div>
      <div className="grid grid-cols-2 gap-2">
        <a href={googleUrl} className="rounded-full border bg-background px-3 py-2.5 text-center text-xs font-semibold hover:bg-secondary">Google</a>
        <button className="rounded-full border bg-background px-3 py-2.5 text-xs font-semibold hover:bg-secondary">Apple</button>
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">New to SK? <Link to="/auth/register" className="font-semibold text-indigo hover:underline">Create account</Link></p>
    </>
  );
}

function Field({
  icon,
  trailing,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <label className="relative block">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
      <input
        {...props}
        className={`w-full rounded-full border bg-background py-3 text-sm outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20 ${trailing ? "pl-10 pr-12" : "px-10"}`}
      />
      {trailing && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</span>
      )}
    </label>
  );
}
