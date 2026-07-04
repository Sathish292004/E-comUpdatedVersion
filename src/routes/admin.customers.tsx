import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, Mail, Phone, MapPin, AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi, type AdminCustomer } from "@/lib/api/admin";
import { formatINR, formatDate } from "@/lib/format";

export const Route = createFileRoute("/admin/customers")({
  head: () => ({ meta: [{ title: "Customers — Admin" }] }),
  component: AdminCustomers,
});

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

function AdminCustomers() {
  const [q, setQ] = useState("");
  const [tier, setTier] = useState<"all" | "vip" | "regular">("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const list = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: () => adminApi.customers.list(),
    retry: false,
  });

  const items = list.data ?? [];
  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    return items.filter((c) => {
      const matchQ = !k || c.name.toLowerCase().includes(k) || c.email.toLowerCase().includes(k);
      const spent = c.spent ?? 0;
      const isVip = spent >= 50000;
      const matchT = tier === "all" || (tier === "vip" ? isVip : !isVip);
      return matchQ && matchT;
    });
  }, [items, q, tier]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Customers</h1>
          <p className="text-sm text-muted-foreground">
            {list.isLoading
              ? "Loading…"
              : list.isError
                ? "Unable to load customers"
                : `${filtered.length} of ${items.length} customers`}
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or email…"
              className="w-full rounded-full border bg-background px-9 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo/20 sm:w-64"
            />
          </div>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as typeof tier)}
            className="rounded-full border bg-background px-4 py-2 text-sm font-semibold outline-none"
          >
            <option value="all">All tiers</option>
            <option value="vip">VIP (₹50K+)</option>
            <option value="regular">Regular</option>
          </select>
        </div>
      </div>

      {list.isError && <ErrorPanel onRetry={() => list.refetch()} />}

      {list.isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-3xl border bg-card/60" />
          ))}
        </div>
      )}

      {!list.isLoading && !list.isError && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c, i) => {
            const spent = c.spent ?? 0;
            const ordersN = c.orders ?? 0;
            const year = c.since ? formatDate(c.since) : "—";
            return (
              <motion.button
                key={c.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedId(c.id)}
                className="rounded-3xl border bg-card p-5 text-left shadow-card transition hover:shadow-glow"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-primary text-sm font-bold text-white">
                    {initials(c.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-bold">{c.name}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">{c.email}</p>
                  </div>
                  {spent >= 50000 && (
                    <span className="rounded-full bg-orange/15 px-2 py-0.5 text-[10px] font-bold text-orange">
                      VIP
                    </span>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <Stat label="Orders" value={String(ordersN)} />
                  <Stat label="Spent" value={formatINR(spent)} />
                  <Stat label="Since" value={String(year)} />
                </div>
              </motion.button>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
              {items.length === 0
                ? "No customers registered yet."
                : "No customers match your filters."}
            </p>
          )}
        </div>
      )}

      <AnimatePresence>
        {selectedId != null && (
          <CustomerDrawer
            loading={false}
            error={false}
            customer={items.find((c) => c.id === selectedId) ?? null}
            onClose={() => setSelectedId(null)}
            onRetry={() => list.refetch()}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-base font-black">{value}</p>
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
    </div>
  );
}

function ErrorPanel({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-3xl border border-destructive/30 bg-destructive/5 p-5">
      <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
      <div className="flex-1">
        <p className="text-sm font-bold text-destructive">Unable to load customers</p>
        <p className="mt-1 text-xs text-muted-foreground">
          The backend endpoint <code className="font-mono">GET /api/admin/customers</code> did
          respond. This page will populate automatically once the endpoint is available.
        </p>
      </div>
      <button
        onClick={onRetry}
        className="rounded-full border bg-background px-4 py-2 text-xs font-semibold hover:bg-secondary"
      >
        Retry
      </button>
    </div>
  );
}

function CustomerDrawer({
  customer,
  loading,
  error,
  onClose,
  onRetry,
}: {
  customer: AdminCustomer | null;
  loading: boolean;
  error: boolean;
  onClose: () => void;
  onRetry: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
    >
      <motion.aside
        initial={{ x: 400 }}
        animate={{ x: 0 }}
        exit={{ x: 400 }}
        transition={{ type: "spring", damping: 28, stiffness: 240 }}
        onClick={(e) => e.stopPropagation()}
        className="ml-auto h-full w-full max-w-md overflow-y-auto bg-card p-6 shadow-card"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-black">Customer profile</h2>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading && !customer && (
          <div className="space-y-3">
            <div className="h-16 animate-pulse rounded-2xl bg-secondary/60" />
            <div className="h-24 animate-pulse rounded-2xl bg-secondary/60" />
          </div>
        )}

        {error && !customer && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <p className="font-bold text-destructive">Failed to load profile</p>
            <p className="mt-1 text-xs text-muted-foreground">
              <code className="font-mono">GET /api/admin/customers/&#123;id&#125;</code> is not
              available yet.
            </p>
            <button
              onClick={onRetry}
              className="mt-3 rounded-full border bg-background px-4 py-1.5 text-xs font-semibold hover:bg-secondary"
            >
              Retry
            </button>
          </div>
        )}

        {customer && (
          <>
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-primary text-lg font-bold text-white">
                {initials(customer.name)}
              </div>

              <div>
                <p className="text-lg font-black">{customer.name}</p>

                <p className="text-xs text-muted-foreground">
                  {customer.role || "CUSTOMER"}
                  {customer.since ? ` · Joined ${formatDate(customer.since)}` : ""}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2 text-sm">
              <div className="flex items-center gap-2 rounded-xl border bg-secondary/40 p-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {customer.email}
              </div>

              {customer.phone && (
                <div className="flex items-center gap-2 rounded-xl border bg-secondary/40 p-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {customer.phone}
                </div>
              )}

              {customer.address && (
                <div className="flex items-start gap-2 rounded-xl border bg-secondary/40 p-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  {customer.address}
                </div>
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border bg-card p-4 text-center">
                <p className="text-2xl font-black">{customer.orders}</p>
                <p className="text-[10px] uppercase text-muted-foreground">Orders</p>
              </div>

              <div className="rounded-2xl border bg-card p-4 text-center">
                <p className="text-2xl font-black">{formatINR(customer.spent)}</p>
                <p className="text-[10px] uppercase text-muted-foreground">Lifetime value</p>
              </div>
            </div>
          </>
        )}
      </motion.aside>
    </motion.div>
  );
}
