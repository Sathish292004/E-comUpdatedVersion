import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { profileApi, type CustomerProfile } from "@/lib/api/profile";
import { addressesApi, type AddressInput } from "@/lib/api/addresses";
import { Loader2, Trash2, Star, ShieldCheck } from "lucide-react";
import { AUTH_PROVIDER_KEY } from "@/lib/api/client";

export const Route = createFileRoute("/account/")({
  head: () => ({ meta: [{ title: "Profile — SK" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const provider = typeof window !== "undefined" ? window.localStorage.getItem(AUTH_PROVIDER_KEY) : null;
  const isGoogle = provider === "google";
  return (
    <div className="grid gap-4">
      <ProfileCard />
      {isGoogle ? <GoogleAccountCard /> : <PasswordCard />}
      <AddressesCard />
    </div>
  );
}

function ProfileCard() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["profile"], queryFn: profileApi.get });
  const [form, setForm] = useState<CustomerProfile>({ name: "", email: "", phone: "", address: "" });
  useEffect(() => { if (data) setForm(data); }, [data]);
  const save = useMutation({
    mutationFn: () => profileApi.update({ name: form.name, phone: form.phone, address: form.address }),
    onSuccess: () => { toast.success("Profile updated"); qc.invalidateQueries({ queryKey: ["profile"] }); },
    onError: (e: { message?: string }) => toast.error(e?.message ?? "Update failed"),
  });

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border bg-card p-6 shadow-card">
      <h2 className="text-lg font-bold">Personal information</h2>
      {isLoading && <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading…</p>}
      {error && <p className="mt-2 text-sm text-destructive">Could not load profile.</p>}
      {data && (
        <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Field label="Email" value={form.email} type="email" onChange={() => {}} disabled />
          <Field label="Phone" value={form.phone} type="tel" onChange={(v) => setForm({ ...form, phone: v })} required />
          <Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} required />
          <button disabled={save.isPending} className="sm:col-span-2 mt-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-bold text-background disabled:opacity-60">
            {save.isPending ? "Saving…" : "Save changes"}
          </button>
        </form>
      )}
    </motion.section>
  );
}

function PasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const change = useMutation({
    mutationFn: () => profileApi.changePassword({ currentPassword: current, newPassword: next }),
    onSuccess: () => { toast.success("Password updated"); setCurrent(""); setNext(""); },
    onError: (e: { message?: string }) => toast.error(e?.message ?? "Change failed"),
  });
  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-3xl border bg-card p-6 shadow-card">
      <h2 className="text-lg font-bold">Change password</h2>
      <form onSubmit={(e) => { e.preventDefault(); if (next.length < 8) return toast.error("Password must be 8+ chars"); change.mutate(); }} className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Current password" type="password" value={current} onChange={setCurrent} required />
        <Field label="New password" type="password" value={next} onChange={setNext} required />
        <button disabled={change.isPending} className="sm:col-span-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-bold text-background disabled:opacity-60">
          {change.isPending ? "Updating…" : "Update password"}
        </button>
      </form>
    </motion.section>
  );
}

function GoogleAccountCard() {
  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-3xl border bg-card p-6 shadow-card">
      <h2 className="flex items-center gap-2 text-lg font-bold"><ShieldCheck className="h-5 w-5 text-emerald" />Password</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        You signed in with Google. Your password is managed by your Google Account.
      </p>
      <a
        href="https://myaccount.google.com/security"
        target="_blank"
        rel="noreferrer noopener"
        className="mt-4 inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-xs font-semibold hover:bg-secondary"
      >
        Manage Google Account
      </a>
    </motion.section>
  );
}

function AddressesCard() {
  const qc = useQueryClient();
  const { data: list = [], isLoading } = useQuery({ queryKey: ["addresses"], queryFn: addressesApi.list });
  const empty: AddressInput = { fullName: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", postalCode: "", country: "India", defaultAddress: false };
  const [form, setForm] = useState<AddressInput>(empty);
  const [editingId, setEditingId] = useState<number | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["addresses"] });
  const add = useMutation({ mutationFn: () => addressesApi.add(form), onSuccess: () => { toast.success("Address added"); setForm(empty); invalidate(); }, onError: (e: { message?: string }) => toast.error(e?.message ?? "Failed") });
  const update = useMutation({ mutationFn: (id: number) => addressesApi.update(id, form), onSuccess: () => { toast.success("Address updated"); setEditingId(null); setForm(empty); invalidate(); }, onError: (e: { message?: string }) => toast.error(e?.message ?? "Failed") });
  const remove = useMutation({ mutationFn: (id: number) => addressesApi.remove(id), onSuccess: () => { toast.success("Address removed"); invalidate(); }, onError: (e: { message?: string }) => toast.error(e?.message ?? "Failed") });

  const submit = (e: React.FormEvent) => { e.preventDefault(); if (editingId != null) update.mutate(editingId); else add.mutate(); };
  const startEdit = (id: number) => {
    const a = list.find((x) => x.id === id); if (!a) return;
    setEditingId(id);
    setForm({ fullName: a.fullName, phone: a.phone, addressLine1: a.addressLine1, addressLine2: a.addressLine2, city: a.city, state: a.state, postalCode: a.postalCode, country: a.country, defaultAddress: a.defaultAddress });
  };

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-3xl border bg-card p-6 shadow-card">
      <h2 className="text-lg font-bold">Saved addresses</h2>
      {isLoading && <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading…</p>}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {list.map((a) => (
          <div key={a.id} className="rounded-2xl border bg-secondary/40 p-4 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-bold">{a.fullName}{a.defaultAddress && <span className="inline-flex items-center gap-1 rounded-full bg-emerald/15 px-2 py-0.5 text-[10px] font-bold text-emerald"><Star className="h-3 w-3" />Default</span>}</p>
                <p className="mt-1 text-muted-foreground">{a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ""}<br/>{a.city}, {a.state} {a.postalCode}<br/>{a.country}<br/>{a.phone}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <button onClick={() => startEdit(a.id)} className="rounded-lg border bg-background px-2 py-1 text-xs">Edit</button>
                <button onClick={() => remove.mutate(a.id)} className="rounded-lg border bg-background px-2 py-1 text-xs text-destructive"><Trash2 className="mx-auto h-3 w-3" /></button>
              </div>
            </div>
          </div>
        ))}
        {!isLoading && list.length === 0 && <p className="text-sm text-muted-foreground">No addresses saved yet.</p>}
      </div>

      <form onSubmit={submit} className="mt-6 grid gap-3 sm:grid-cols-2">
        <h3 className="sm:col-span-2 text-sm font-bold">{editingId != null ? "Edit address" : "Add new address"}</h3>
        <Field label="Full name" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} required />
        <Field label="Phone" type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />
        <Field label="Address line 1" value={form.addressLine1} onChange={(v) => setForm({ ...form, addressLine1: v })} required className="sm:col-span-2" />
        <Field label="Address line 2" value={form.addressLine2} onChange={(v) => setForm({ ...form, addressLine2: v })} className="sm:col-span-2" />
        <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} required />
        <Field label="State" value={form.state} onChange={(v) => setForm({ ...form, state: v })} required />
        <Field label="Postal code" value={form.postalCode} onChange={(v) => setForm({ ...form, postalCode: v })} required />
        <Field label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} required />
        <label className="sm:col-span-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={form.defaultAddress} onChange={(e) => setForm({ ...form, defaultAddress: e.target.checked })} />Set as default</label>
        <div className="sm:col-span-2 flex gap-2">
          <button disabled={add.isPending || update.isPending} className="rounded-full bg-foreground px-5 py-2.5 text-sm font-bold text-background disabled:opacity-60">
            {editingId != null ? (update.isPending ? "Saving…" : "Save address") : (add.isPending ? "Adding…" : "Add address")}
          </button>
          {editingId != null && <button type="button" onClick={() => { setEditingId(null); setForm(empty); }} className="rounded-full border bg-background px-5 py-2.5 text-sm font-semibold">Cancel</button>}
        </div>
      </form>
    </motion.section>
  );
}

function Field({ label, value, onChange, className = "", ...props }: {
  label: string; value: string; onChange: (v: string) => void; className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</span>
      <input {...props} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20 disabled:opacity-60" />
    </label>
  );
}
