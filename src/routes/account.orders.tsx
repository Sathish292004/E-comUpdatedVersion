import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Package, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listMyOrders, ordersQueryKeys } from "@/lib/api/orders";
import { formatINR, formatDate, cn } from "@/lib/format";

export const Route = createFileRoute("/account/orders")({
  head: () => ({ meta: [{ title: "Orders — SK" }] }),
  component: Orders,
});

function Orders() {
  const {
    data: orders = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ordersQueryKeys.mine,
    queryFn: listMyOrders,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading orders…</p>;
  if (isError) return <p className="text-sm text-destructive">Unable to load your orders.</p>;
  if (orders.length === 0) return <p className="text-sm text-muted-foreground">No orders yet.</p>;
  return (
    <div className="space-y-3">
      {orders.map((o, i) => (
        <motion.div
          key={o.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
        >
          <Link
            to="/account/orders/$id"
            params={{ id: o.id }}
            className="flex items-center gap-4 rounded-3xl border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft"
          >
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent text-indigo">
              <Package className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs text-muted-foreground">{o.id}</p>
              <p className="text-sm font-bold">
                {o.items} {o.items === 1 ? "item" : "items"} · {formatINR(o.total)}
              </p>
              <p className="text-xs text-muted-foreground">
                {o.date ? `Placed on ${formatDate(o.date)}` : ""}
              </p>
            </div>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-bold",
                o.status === "Delivered"
                  ? "bg-emerald/15 text-emerald"
                  : "bg-orange/15 text-orange",
              )}
            >
              {o.status}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
