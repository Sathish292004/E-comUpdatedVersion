import { SmartImage } from "@/components/ui/SmartImage";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, ShoppingBag, Users, DollarSign, ArrowUpRight, Package, AlertTriangle } from "lucide-react";
import { formatINR, cn } from "@/lib/format";
import { productImage, prodStock } from "@/lib/api/helpers";
import { listProducts } from "@/lib/api/products";
import { listOrders } from "@/lib/api/orders";
import { adminApi } from "@/lib/api/admin";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

function Dashboard() {
  const products = useQuery({ queryKey: ["products"], queryFn: listProducts }).data ?? [];
  const orders = useQuery({ queryKey: ["orders", "admin"], queryFn: listOrders }).data ?? [];
  const dashQ = useQuery({ queryKey: ["admin", "dashboard"], queryFn: adminApi.dashboard, retry: false });
  const dash = dashQ.data ?? null;
  const loading = dashQ.isLoading;

  const revenue = useMemo(
    () => (dash ? Number(dash.totalRevenue ?? 0) : orders.reduce((s, o) => s + (o.total || 0), 0)),
    [orders, dash],
  );
  const orderCount = dash?.totalOrders ?? orders.length;
  const productCount = dash?.totalProducts ?? products.length;
  const customerCount = dash?.totalCustomers ?? 0;
  const avgOrder = orderCount ? revenue / orderCount : 0;
  const lowStock = useMemo(() => products.filter((p) => prodStock(p) <= 10).slice(0, 6), [products]);
  const bestSelling = useMemo(() => [...products].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 4), [products]);
  const recentOrders = orders.slice(0, 6);

  const stats = [
    { label: "Revenue", value: formatINR(revenue), Icon: DollarSign, color: "from-indigo/15 to-indigo/5", iconBg: "bg-indigo/15 text-indigo" },
    { label: "Orders", value: orderCount.toLocaleString(), Icon: ShoppingBag, color: "from-emerald/15 to-emerald/5", iconBg: "bg-emerald/15 text-emerald" },
    { label: "Customers", value: customerCount.toLocaleString(), Icon: Users, color: "from-orange/15 to-orange/5", iconBg: "bg-orange/15 text-orange" },
    { label: "Products", value: productCount.toLocaleString(), Icon: Package, color: "from-royal/15 to-royal/5", iconBg: "bg-royal/15 text-royal" },
    { label: "Avg. order", value: formatINR(avgOrder), Icon: TrendingUp, color: "from-indigo/15 to-indigo/5", iconBg: "bg-indigo/15 text-indigo" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Welcome back, Admin 👋</h1>
        <p className="mt-1 text-sm text-muted-foreground">{loading ? "Loading insights…" : "Here's how your store is doing today."}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className={`rounded-3xl border bg-gradient-to-br ${s.color} bg-card p-5 shadow-card`}>
            <div className="flex items-start justify-between">
              <div className={`grid h-10 w-10 place-items-center rounded-2xl ${s.iconBg}`}><s.Icon className="h-5 w-5" /></div>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald/15 px-2 py-0.5 text-[10px] font-bold text-emerald"><ArrowUpRight className="h-3 w-3" />live</span>
            </div>
            <p className="mt-4 text-2xl font-black">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-3xl border bg-card p-6 shadow-card">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-lg font-bold">Revenue overview</h2>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </div>
            <span className="text-2xl font-black">{formatINR(revenue)}</span>
          </div>
          <Chart />
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-3xl border bg-card p-6 shadow-card">
          <h2 className="text-lg font-bold">Best selling</h2>
          <ul className="mt-3 space-y-3">
            {bestSelling.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3">
                <span className="w-5 text-xs font-bold text-muted-foreground">{i + 1}</span>
                <SmartImage src={productImage(p)} alt={p.name} wrapperClassName="h-10 w-10 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-bold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.brand}</p>
                </div>
                <span className="text-sm font-bold">{formatINR(p.price)}</span>
              </li>
            ))}
            {!loading && bestSelling.length === 0 && <li className="text-xs text-muted-foreground">No products yet.</li>}
          </ul>
        </motion.section>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-3xl border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Recent orders</h2>
            <Link to="/admin/orders" className="text-xs font-semibold text-indigo hover:underline">View all →</Link>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr><th className="py-2">Order</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th></tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id} className="border-t">
                    <td className="py-3 font-mono">{o.id}</td>
                    <td>{o.date ? new Date(o.date).toLocaleDateString() : "—"}</td>
                    <td>{o.items}</td>
                    <td className="font-semibold">{formatINR(o.total)}</td>
                    <td><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${o.status === "Delivered" ? "bg-emerald/15 text-emerald" : "bg-orange/15 text-orange"}`}>{o.status}</span></td>
                  </tr>
                ))}
                {!loading && recentOrders.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-xs text-muted-foreground">No orders yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="rounded-3xl border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-orange" />Low stock</h2>
            <Link to="/admin/products" className="text-xs font-semibold text-indigo hover:underline">Manage →</Link>
          </div>
          <ul className="mt-3 space-y-3">
            {lowStock.map((p) => {
              const st = prodStock(p);
              return (
                <li key={p.id} className="flex items-center gap-3">
                  <SmartImage src={productImage(p)} alt={p.name} wrapperClassName="h-10 w-10 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-bold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.brand}</p>
                  </div>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", st === 0 ? "bg-destructive/15 text-destructive" : "bg-orange/15 text-orange")}>{st} left</span>
                </li>
              );
            })}
            {!loading && lowStock.length === 0 && <li className="text-xs text-muted-foreground">All products well stocked. 🎉</li>}
          </ul>
        </motion.section>
      </div>
    </div>
  );
}

function Chart() {
  const data = [42, 56, 38, 72, 64, 89, 78];
  const max = Math.max(...data);
  return (
    <div className="mt-6 flex h-48 items-end gap-2">
      {data.map((d, i) => (
        <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${(d / max) * 100}%` }} transition={{ duration: 0.6, delay: 0.3 + i * 0.05, ease: [0.22, 1, 0.36, 1] }} className="flex-1 rounded-t-xl bg-gradient-primary opacity-90" title={`Day ${i + 1}: ₹${d}k`} />
      ))}
    </div>
  );
}
