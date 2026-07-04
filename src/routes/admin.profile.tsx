import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Upload, Save, LogOut, Lock, Eye, EyeOff, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { loadAdminProfile, saveAdminProfile, defaultAdminProfile, type AdminProfile } from "@/lib/admin-settings";
import { useApp } from "@/lib/store/AppContext";
import { ADMIN_SESSION_KEY } from "./admin.login";

export const Route = createFileRoute("/admin/profile")({ component: Profile });

const ADMIN_PASSWORD_KEY = "sk_admin_password_v1";
const DEFAULT_ADMIN_PASSWORD = "Sathsih@2004";

function getAdminPassword(): string {
  if (typeof window === "undefined") return DEFAULT_ADMIN_PASSWORD;
  try { return localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_ADMIN_PASSWORD; } catch { return DEFAULT_ADMIN_PASSWORD; }
}

function setAdminPassword(password: string) {
  try { localStorage.setItem(ADMIN_PASSWORD_KEY, password); } catch {}
}

function fileToDataUrl(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(f);
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Profile() {
  const { logout } = useApp();
  const navigate = useNavigate();
  const [p, setP] = useState<AdminProfile>(defaultAdminProfile);
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [isSaving, setIsSaving] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => { setP(loadAdminProfile()); }, []);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    saveAdminProfile(p);
    setIsSaving(false);
    toast.success("Profile saved", { description: "Your admin profile has been updated." });
  };

  const onPickAvatar = async (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error("Please upload an image file");
    if (f.size > 2 * 1024 * 1024) return toast.error("Image must be under 2 MB");
    const url = await fileToDataUrl(f);
    setP((prev) => ({ ...prev, avatarUrl: url }));
    toast.success("Profile picture updated");
  };

  const onRemoveAvatar = () => {
    setP((prev) => ({ ...prev, avatarUrl: "" }));
    toast.success("Profile picture removed");
  };

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwd.current || !pwd.next || !pwd.confirm) return toast.error("Fill all password fields");
    if (pwd.next !== pwd.confirm) return toast.error("New passwords don't match");
    if (pwd.next.length < 6) return toast.error("Password must be at least 6 characters");

    const currentStored = getAdminPassword();
    if (pwd.current !== currentStored) return toast.error("Current password is incorrect");

    setIsChanging(true);
    await new Promise((r) => setTimeout(r, 500));
    setAdminPassword(pwd.next);
    setPwd({ current: "", next: "", confirm: "" });
    setIsChanging(false);
    toast.success("Password changed", { description: "Your admin password has been updated locally. Connect Spring Boot to persist it server-side." });
  };

  const onLogout = () => {
    try { sessionStorage.removeItem(ADMIN_SESSION_KEY); } catch {}
    logout();
    navigate({ to: "/admin/login", replace: true });
  };

  const strength = useMemo(() => {
    const s = pwd.next;
    if (!s) return 0;
    let score = 0;
    if (s.length >= 8) score += 1;
    if (/[A-Z]/.test(s)) score += 1;
    if (/[0-9]/.test(s)) score += 1;
    if (/[^A-Za-z0-9]/.test(s)) score += 1;
    return score;
  }, [pwd.next]);

  const strengthLabel = ["Weak", "Fair", "Good", "Strong", "Very strong"][strength];
  const strengthColor = ["bg-destructive", "bg-orange-400", "bg-yellow-400", "bg-emerald-400", "bg-emerald-500"][strength];

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black">Admin profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account details and security settings.</p>
      </div>

      <motion.form onSubmit={onSave} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="rounded-3xl border bg-card p-6 shadow-card sm:p-8">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <div className="relative">
            {p.avatarUrl ? (
              <img src={p.avatarUrl} alt="Admin avatar" className="h-24 w-24 rounded-full border-2 border-background object-cover shadow-sm" />
            ) : (
              <div className="grid h-24 w-24 place-items-center rounded-full bg-gradient-primary text-xl font-bold text-white shadow-soft">
                {initials(p.name)}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border bg-secondary/60 px-4 py-2 text-sm font-semibold transition hover:bg-secondary">
              <Upload className="h-4 w-4" />Change picture
              <input type="file" accept="image/*" hidden onChange={(e) => onPickAvatar(e.target.files?.[0])} />
            </label>
            {p.avatarUrl && (
              <button type="button" onClick={onRemoveAvatar} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="h-4 w-4" />Remove
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Full name" icon={User}>
            <input required value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} className="input" placeholder="e.g. SK Admin" />
          </Field>
          <Field label="Email" icon={null}>
            <input type="email" required value={p.email} onChange={(e) => setP({ ...p, email: e.target.value })} className="input" placeholder="admin@skstore.com" />
          </Field>
          <Field label="Phone" icon={null}>
            <input value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} className="input" placeholder="+91 98765 43210" />
          </Field>
          <Field label="Role" icon={Lock}>
            <input disabled value="Administrator" className="input cursor-not-allowed opacity-70" />
          </Field>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button disabled={isSaving} className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-bold text-white shadow-soft transition hover:shadow-glow disabled:opacity-60">
            <Save className="h-4 w-4" />{isSaving ? "Saving..." : "Save profile"}
          </button>
        </div>
      </motion.form>

      <motion.form onSubmit={onChangePassword} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 }} className="rounded-3xl border bg-card p-6 shadow-card sm:p-8">
        <h2 className="flex items-center gap-2 text-lg font-bold"><Lock className="h-4 w-4" />Change password</h2>
        <p className="mt-1 text-xs text-muted-foreground">Update your admin password. Current default is <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">Sathsih@2004</code>.</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <PasswordField label="Current" value={pwd.current} onChange={(v) => setPwd({ ...pwd, current: v })} visible={show.current} onToggle={() => setShow((s) => ({ ...s, current: !s.current }))} />
          <PasswordField label="New" value={pwd.next} onChange={(v) => setPwd({ ...pwd, next: v })} visible={show.next} onToggle={() => setShow((s) => ({ ...s, next: !s.next }))} />
          <PasswordField label="Confirm" value={pwd.confirm} onChange={(v) => setPwd({ ...pwd, confirm: v })} visible={show.confirm} onToggle={() => setShow((s) => ({ ...s, confirm: !s.confirm }))} />
        </div>

        {pwd.next && (
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Strength</span>
              <span className="font-semibold">{strengthLabel}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <motion.div className={`h-full ${strengthColor}`} initial={{ width: 0 }} animate={{ width: `${(strength + 1) * 20}%` }} transition={{ duration: 0.25 }} />
            </div>
          </div>
        )}

        <p className="mt-4 text-[11px] text-muted-foreground">Password changes are saved locally in this frontend-only build. Connect your Spring Boot backend to persist them server-side.</p>
        <button disabled={isChanging} className="mt-4 rounded-full border bg-background px-5 py-2.5 text-sm font-semibold transition hover:bg-secondary disabled:opacity-60">
          {isChanging ? "Updating..." : "Update password"}
        </button>
      </motion.form>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.16 }} className="rounded-3xl border bg-card p-6 shadow-card sm:p-8">
        <h2 className="text-lg font-bold">Session</h2>
        <p className="mt-1 text-xs text-muted-foreground">Sign out of the admin panel on this device.</p>
        <button onClick={onLogout} className="mt-4 inline-flex items-center gap-2 rounded-full border bg-background px-5 py-2.5 text-sm font-semibold transition hover:bg-destructive/10 hover:text-destructive">
          <LogOut className="h-4 w-4" />Sign out
        </button>
      </motion.div>

      <style>{`
        .input { width: 100%; border: 1px solid hsl(var(--border)); background: hsl(var(--background)); border-radius: 0.875rem; padding: 0.625rem 0.875rem; font-size: 0.875rem; outline: none; transition: box-shadow 0.15s, border-color 0.15s; }
        .input:focus { border-color: hsl(var(--primary)); box-shadow: 0 0 0 3px hsl(var(--primary) / 0.15); }
        .input:disabled { background: hsl(var(--muted)); }
      `}</style>
    </div>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon: React.ComponentType<{ className?: string }> | null; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}{label}
      </span>
      {children}
    </label>
  );
}

function PasswordField({ label, value, onChange, visible, onToggle }: { label: string; value: string; onChange: (v: string) => void; visible: boolean; onToggle: () => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="relative">
        <input type={visible ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} className="input pr-10" placeholder={visible ? label : "••••••••"} />
        <button type="button" onClick={onToggle} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground" aria-label={visible ? "Hide password" : "Show password"}>
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  );
}
