import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, Shield } from "lucide-react";
import { useApp } from "@/lib/store/AppContext";
import { toast } from "sonner";
import { useStoreSettings } from "@/hooks/use-store-settings";
import { adminApi } from "@/lib/api/admin";
import { AUTH_TOKEN_KEY } from "@/lib/api/client";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Admin Sign in — SK" }] }),
  component: AdminLogin,
});

export const ADMIN_SESSION_KEY = "sk_admin_session_v1";

function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useApp();
  const settings = useStoreSettings();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);


  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await adminApi.login(email.trim(), password);
      window.localStorage.setItem(AUTH_TOKEN_KEY, res.token);
      const adminUser = { id: email, name: res.name, email, role: "admin" as const };
      login(adminUser);
      try { sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(adminUser)); } catch {}
      toast.success("Welcome back, admin");
      navigate({ to: "/admin", replace: true });
    } catch (err) {
      toast.error((err as { message?: string })?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-secondary/60 to-background p-6">
      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border bg-card p-8 shadow-card"
      >
        <div className="mb-6 flex items-center gap-3">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt={settings.storeName} className="h-11 w-11 rounded-2xl object-cover shadow-soft" />
          ) : (
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-primary text-white shadow-soft">
              <Shield className="h-5 w-5" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-black">{settings.storeName || "SK"} Admin</h1>
            <p className="text-xs text-muted-foreground">Restricted access</p>
          </div>
        </div>

        <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">Email</label>
        <div className="relative mt-1.5">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@skstore.com"
            className="w-full rounded-xl border bg-background px-9 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo/20"
          />
        </div>

        <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-muted-foreground">Password</label>
        <div className="relative mt-1.5">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border bg-background pl-9 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo/20"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-gradient-cta px-5 py-2.5 text-sm font-bold text-white shadow-glow disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in to admin"}
        </button>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Authenticated via Spring Security + JWT.
        </p>
      </motion.form>
    </div>
  );
}