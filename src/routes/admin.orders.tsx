import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Search, X, Ban, Eye } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listOrders, getOrder, updateOrderStatus, ordersQueryKeys, type OrderDetail } from "@/lib/api/orders";
import { formatDate, formatINR, cn } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders")({ component: AdminOrders });

const STATUSES = ["Pending", "Confirmed", "Out for delivery", "Delivered", "Cancelled"];

function statusClass(s: string) {
  if (s === "Delivered") return "bg-emerald/15 text-emerald";
  if (s === "Cancelled") return "bg-destructive/15 text-destructive";
  if (s === "Pending") return "bg-muted text-muted-foreground";
  return "bg-orange/15 text-orange";
}

function AdminOrders() {
  const queryClient = useQueryClient();
  const { data: allOrders = [], isLoading: loading } = useQuery({
    queryKey: ordersQueryKeys.admin,
    queryFn: listOrders,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  console.log("ALL ORDERS:", allOrders);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<OrderDetail | null>(null);

  const filtered = useMemo(() => allOrders.filter((o) => {
    const k = q.toLowerCase();
    const matchQ = !k || o.id.toLowerCase().includes(k);
    const matchS = statusFilter === "all" || o.status === statusFilter;
    return matchQ && matchS;
  }), [allOrders, q, statusFilter]);

  const update = async (id: string, status: string) => {
    try {
      await updateOrderStatus(id, status);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] }),
      ]);
      toast.success(status === "Cancelled" ? "Order cancelled" : `Status updated to ${status}`);
    } catch (e) {
      toast.error((e as { message?: string })?.message ?? "Update failed");
    }
  };

  const openDetail = async (id: string) => {
    const d = await getOrder(id);
    if (d) setSelected(d);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Orders</h1>
          <p className="text-sm text-muted-foreground">{loading ? "Loading…" : `${filtered.length} of ${allOrders.length} orders`}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by order ID…" className="w-64 rounded-full border bg-background px-9 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo/20" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-full border bg-background px-4 py-2 text-sm font-semibold outline-none">
            <option value="all">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <motion.div layout className="overflow-hidden rounded-3xl border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-secondary/40 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="px-4 py-3">Order</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th className="text-right pr-4">Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map((o, i) => (
              <motion.tr key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-t hover:bg-secondary/30">
                <td className="px-4 py-3 font-mono">{o.id}</td>
                <td>{o.date ? formatDate(o.date) : "—"}</td>
                <td>{o.items}</td>
                <td className="font-semibold">{formatINR(o.total)}</td>
                <td>
                  <select
                    value={o.status}
                    onChange={(e) => update(o.id, e.target.value)}
                    className={cn("rounded-full border-0 px-2 py-1 text-xs font-bold outline-none", statusClass(o.status))}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="pr-4">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openDetail(o.id)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-secondary" title="View details"><Eye className="h-3.5 w-3.5" /></button>
                    <button onClick={() => update(o.id, "Cancelled")} disabled={o.status === "Cancelled"} className="grid h-8 w-8 place-items-center rounded-full hover:bg-destructive/10 hover:text-destructive disabled:opacity-40" title="Cancel order"><Ban className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </motion.tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">No orders match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </motion.div>

      <AnimatePresence>
        {selected && <OrderDrawer order={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}

function OrderDrawer({ order, onClose }: { order: OrderDetail; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm">
      <motion.aside initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} transition={{ type: "spring", damping: 28, stiffness: 240 }} onClick={(e) => e.stopPropagation()} className="ml-auto h-full w-full max-w-md overflow-y-auto bg-card p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <div><h2 className="font-black">Order {order.id}</h2><p className="text-xs text-muted-foreground">{order.date ? formatDate(order.date) : "—"}</p></div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4 text-sm">
          <div className="rounded-2xl border bg-secondary/40 p-4">
            <p className="text-xs font-bold uppercase text-muted-foreground">Summary</p>
            <div className="mt-2 flex items-center justify-between"><span>Items</span><span className="font-semibold">{order.items}</span></div>
            <div className="flex items-center justify-between"><span>Total</span><span className="font-black">{formatINR(order.total)}</span></div>
            <div className="flex items-center justify-between"><span>Status</span><span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", statusClass(order.status))}>{order.status}</span></div>
          </div>
          <div className="rounded-2xl border p-4">
            <p className="text-xs font-bold uppercase text-muted-foreground">Customer</p>
            <p className="mt-2 font-semibold">{order.customerName}</p>
            {order.email && <p className="text-muted-foreground">{order.email}</p>}
          </div>
          <div className="rounded-2xl border p-4">
            <p className="text-xs font-bold uppercase text-muted-foreground">Items</p>
            <ul className="mt-3 space-y-2">
              {order.lineItems.map((it, idx) => (
                <li key={idx} className="flex items-center justify-between gap-3 text-xs">
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold">{it.productName}</span>
                    <span className="text-muted-foreground"> · Qty {it.quantity}</span>
                  </span>
                  <span className="font-semibold">{formatINR(it.totalPrice)}</span>
                </li>
              ))}
              {order.lineItems.length === 0 && (
                <li className="text-xs text-muted-foreground">No items on this order.</li>
              )}
            </ul>
          </div>
        </div>
      </motion.aside>
    </motion.div>
  );
}
