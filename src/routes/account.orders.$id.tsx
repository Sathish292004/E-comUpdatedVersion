import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cancelMyOrder, getMyOrder, ordersQueryKeys } from "@/lib/api/orders";
import { toast } from "sonner";
import { formatDate, formatINR, cn } from "@/lib/format";

export const Route = createFileRoute("/account/orders/$id")({
    head: () => ({ meta: [{ title: "Order details" }] }),
    component: OrderDetailPage,
});

function statusClass(s: string) {
    if (s === "Delivered") return "bg-emerald/15 text-emerald";
    if (s === "Cancelled") return "bg-destructive/15 text-destructive";
    if (s === "Pending") return "bg-muted text-muted-foreground";
    return "bg-orange/15 text-orange";
}

function OrderDetailPage() {
    const { id } = Route.useParams();
    const queryClient = useQueryClient();
    const { data: order, isLoading, isError } = useQuery({
        queryKey: ordersQueryKeys.detail(id),
        queryFn: () => getMyOrder(id),
        staleTime: 0,
        refetchOnMount: "always",
    });

    if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
    if (isError)
        return (
            <p className="text-sm text-destructive">
                Unable to load this order. Please try again later.
            </p>
        );
    if (!order) return <p className="text-sm text-muted-foreground">Order not found.</p>;

    const canCancel = order.status !== "Delivered" && order.status !== "Cancelled";
    const doCancel = async () => {
        if (!confirm("Cancel this order?")) return;
        try {
            await cancelMyOrder(order.id);
            await queryClient.invalidateQueries({ queryKey: ordersQueryKeys.all });
            toast.success("Order cancelled");
        } catch (e) {
            toast.error((e as { message?: string })?.message ?? "Unable to cancel order");
        }
    };

    return (
        <div className="space-y-5">
            <Link
                to="/account/orders"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="h-3 w-3" />
                All orders
            </Link>

            <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border bg-card p-6 shadow-card"
            >
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="font-mono text-xs text-muted-foreground">{order.id}</p>
                        <h1 className="text-2xl font-black">{order.customerName || "Order"}</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {order.date ? `Placed on ${formatDate(order.date)}` : ""}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
            <span
                className={cn(
                    "rounded-full px-3 py-1 text-xs font-bold",
                    statusClass(order.status),
                )}
            >
              {order.status}
            </span>
                        {canCancel && (
                            <button
                                onClick={doCancel}
                                className="rounded-full border bg-background px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10"
                            >
                                Cancel order
                            </button>
                        )}
                    </div>
                </div>
            </motion.section>

            <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="rounded-3xl border bg-card p-6 shadow-card"
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">Items</h2>
                    <p className="text-sm font-black">{formatINR(order.total)}</p>
                </div>
                <ul className="mt-3 divide-y">
                    {order.lineItems.map((it, i) => (
                        <li key={i} className="flex items-center justify-between gap-3 py-3">
                            <div className="min-w-0">
                                <p className="line-clamp-1 text-sm font-bold">{it.productName}</p>
                                <p className="text-xs text-muted-foreground">Qty {it.quantity}</p>
                            </div>
                            <span className="text-sm font-semibold">{formatINR(it.totalPrice)}</span>
                        </li>
                    ))}
                    {order.lineItems.length === 0 && (
                        <li className="py-6 text-center text-sm text-muted-foreground">
                            No items on this order.
                        </li>
                    )}
                </ul>
            </motion.section>
        </div>
    );
}