import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Users, ShoppingBag, DollarSign } from "lucide-react";
import { listProducts } from "@/lib/api/products";
import { listOrders } from "@/lib/api/orders";
import { formatINR } from "@/lib/format";

export const Route = createFileRoute("/admin/analytics")({ component: Analytics });

function Analytics() {
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: listProducts });
  const { data: orders = [] } = useQuery({ queryKey: ["orders", "admin"], queryFn: listOrders });

  const revenue = useMemo(() => orders.reduce((s, o) => s + o.total, 0), [orders]);
  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => map.set(p.category || "uncategorised", (map.get(p.category || "uncategorised") ?? 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [products]);
  const maxCat = Math.max(1, ...byCategory.map(([, n]) => n));

  const trend = useMemo(() => {
    // Compute revenue per month from real orders (last 12 months).
    const now = new Date();
    const buckets = Array.from({ length: 12 }, () => 0);
    orders.forEach((o) => {
      if (!o.date) return;
      const d = new Date(o.date);
      const diff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
      if (diff >= 0 && diff < 12) buckets[11 - diff] += o.total;
    });
    return buckets;
  }, [orders]);
  const maxTrend = Math.max(1, ...trend);

  const kpis = [
    { label: "Revenue", value: formatINR(revenue), Icon: DollarSign, color: "bg-indigo/15 text-indigo" },
    { label: "Orders", value: orders.length, Icon: ShoppingBag, color: "bg-emerald/15 text-emerald" },
    { label: "Products", value: products.length, Icon: TrendingUp, color: "bg-orange/15 text-orange" },
    { label: "Conversion", value: "3.4%", Icon: Users, color: "bg-royal/15 text-royal" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Performance insights across the store.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-3xl border bg-card p-5 shadow-card">
            <div className={`mb-3 grid h-10 w-10 place-items-center rounded-2xl ${k.color}`}><k.Icon className="h-5 w-5" /></div>
            <p className="text-2xl font-black">{k.value}</p>
            <p className="text-xs text-muted-foreground">{k.label}</p>
          </motion.div>
        ))}
      </div>

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border bg-card p-6 shadow-card">
        <h2 className="text-lg font-bold">Sales trend (12 months)</h2>
        <div className="mt-6 flex h-56 items-end gap-2">
          {trend.map((d, i) => (
            <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${(d / maxTrend) * 100}%` }} transition={{ duration: 0.6, delay: 0.2 + i * 0.04, ease: [0.22, 1, 0.36, 1] }} className="flex-1 rounded-t-xl bg-gradient-primary opacity-90" title={`Month ${i + 1}: ${d}`} />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] uppercase text-muted-foreground">
          {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m) => <span key={m}>{m}</span>)}
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border bg-card p-6 shadow-card">
        <h2 className="text-lg font-bold">Products by category</h2>
        <ul className="mt-4 space-y-3">
          {byCategory.map(([cat, n]) => (
            <li key={cat}>
              <div className="mb-1 flex justify-between text-xs"><span className="font-semibold capitalize">{cat}</span><span className="text-muted-foreground">{n}</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(n / maxCat) * 100}%` }} transition={{ duration: 0.6 }} className="h-full rounded-full bg-gradient-cta" />
              </div>
            </li>
          ))}
          {byCategory.length === 0 && <li className="text-sm text-muted-foreground">No data.</li>}
        </ul>
      </motion.section>
    </div>
  );
}