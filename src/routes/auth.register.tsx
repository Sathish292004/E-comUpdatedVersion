import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mail, Lock, User, Phone, MapPin, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/lib/store/AppContext";
import { toast } from "sonner";
import { registerFull } from "@/lib/api/auth";
import { AUTH_TOKEN_KEY, AUTH_PROVIDER_KEY } from "@/lib/api/client";

export const Route = createFileRoute("/auth/register")({
  head: () => ({ meta: [{ title: "Create account — SK" }] }),
  component: Register,
});

function Register() {
  const { login } = useApp();
  const nav = useNavigate();
  const [f, setF] = useState({ name: "", email: "", phone: "", address: "", pw: "" });
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.name.trim().length < 3) return toast.error("Name must be 3+ characters");
    if (!f.email.includes("@")) return toast.error("Enter a valid email");
    if (!/^[6-9]\d{9}$/.test(f.phone)) return toast.error("Enter a valid 10-digit Indian mobile");
    if (f.address.trim().length < 5) return toast.error("Address must be 5+ characters");
    if (f.pw.length < 8) return toast.error("Password must be 8+ characters");
    setBusy(true);
    try {
      const { user, token } = await registerFull({
        name: f.name, email: f.email, phone: f.phone, address: f.address, password: f.pw,
      });
      window.localStorage.setItem(AUTH_TOKEN_KEY, token);
      window.localStorage.setItem(AUTH_PROVIDER_KEY, "local");
      login(user);
      toast.success("Account created");
      nav({ to: "/account" });
    } catch (err) {
      toast.error((err as { message?: string })?.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  };
  const strength = Math.min(4, Math.floor(f.pw.length / 3));
  return (
    <>
      <h1 className="text-3xl font-black">Create account</h1>
      <p className="mt-1 text-sm text-muted-foreground">Join the SK list. Get 10% off your first order.</p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <Field icon={<User className="h-4 w-4" />} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Full name" required />
        <Field icon={<Mail className="h-4 w-4" />} type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="Email address" required />
        <Field icon={<Phone className="h-4 w-4" />} type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="10-digit mobile number" required />
        <Field icon={<MapPin className="h-4 w-4" />} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder="Address" required />
        <Field
          icon={<Lock className="h-4 w-4" />}
          type={showPw ? "text" : "password"}
          value={f.pw}
          onChange={(e) => setF({ ...f, pw: e.target.value })}
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
        <div className="flex gap-1.5">
          {[0,1,2,3].map((i) => (<div key={i} className={`h-1 flex-1 rounded-full transition ${i < strength ? "bg-emerald" : "bg-secondary"}`} />))}
        </div>
        <label className="flex items-start gap-2 text-xs"><input type="checkbox" required className="mt-0.5 accent-indigo" /><span className="text-muted-foreground">I agree to the <a className="font-semibold text-indigo">Terms</a> and <a className="font-semibold text-indigo">Privacy Policy</a></span></label>
        <button disabled={busy} className="mt-2 w-full rounded-full bg-gradient-cta px-5 py-3 text-sm font-bold text-white shadow-glow disabled:opacity-60">{busy ? "Creating…" : "Create account"}</button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">Already have an account? <Link to="/auth/login" className="font-semibold text-indigo hover:underline">Sign in</Link></p>
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
