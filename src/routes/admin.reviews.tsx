import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AlertTriangle, Search, Star, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi, type AdminReview } from "@/lib/api/admin";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/admin/reviews")({
  head: () => ({ meta: [{ title: "Reviews — Admin" }] }),
  component: AdminReviews,
});

function AdminReviews() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [ratingFilter, setRatingFilter] = useState<"all" | "1" | "2" | "3" | "4" | "5">("all");

  const list = useQuery({
    queryKey: ["admin", "reviews"],
    queryFn: () => adminApi.reviews.list(),
    retry: false,
  });

  const remove = useMutation({
    mutationFn: (id: number) => adminApi.reviews.remove(id),
    onSuccess: () => {
      toast.success("Review removed");
      qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
    },
    onError: (e: { message?: string }) => toast.error(e?.message ?? "Failed to delete review"),
  });

  const items = list.data ?? [];
  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    return items.filter((r) => {
      const matchQ =
        !k ||
        r.customerName.toLowerCase().includes(k) ||
        r.productName.toLowerCase().includes(k) ||
        r.comment.toLowerCase().includes(k);
      const matchR = ratingFilter === "all" || r.rating === Number(ratingFilter);
      return matchQ && matchR;
    });
  }, [items, q, ratingFilter]);

  const onDelete = (r: AdminReview) => {
    if (!confirm(`Delete review by ${r.customerName}? This cannot be undone.`)) return;
    remove.mutate(r.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Reviews</h1>
          <p className="text-sm text-muted-foreground">
            {list.isLoading
              ? "Loading…"
              : list.isError
                ? "Unable to load reviews"
                : `${filtered.length} of ${items.length} reviews`}
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search product, customer or text…"
              className="w-full rounded-full border bg-background px-9 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo/20 sm:w-72"
            />
          </div>
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value as typeof ratingFilter)}
            className="rounded-full border bg-background px-4 py-2 text-sm font-semibold outline-none"
          >
            <option value="all">All ratings</option>
            {[5, 4, 3, 2, 1].map((s) => (
              <option key={s} value={s}>
                {s} star{s > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {list.isError && (
        <div className="flex items-start gap-3 rounded-3xl border border-destructive/30 bg-destructive/5 p-5">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
          <div className="flex-1">
            <p className="text-sm font-bold text-destructive">Unable to load reviews</p>
            <p className="mt-1 text-xs text-muted-foreground">
              The backend endpoint <code className="font-mono">GET /api/admin/reviews</code> did
              not respond. This page will populate automatically once the endpoint is available.
            </p>
          </div>
          <button
            onClick={() => list.refetch()}
            className="rounded-full border bg-background px-4 py-2 text-xs font-semibold hover:bg-secondary"
          >
            Retry
          </button>
        </div>
      )}

      {list.isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl border bg-card/60" />
          ))}
        </div>
      )}

      {!list.isLoading && !list.isError && (
        <div className="overflow-hidden rounded-3xl border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-secondary/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th>Customer</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Date</th>
                <th className="pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-t align-top hover:bg-secondary/30"
                >
                  <td className="px-4 py-3 font-semibold">{r.productName}</td>
                  <td>
                    <div className="text-sm font-semibold">{r.customerName}</div>
                    {r.customerEmail && (
                      <div className="text-xs text-muted-foreground">{r.customerEmail}</div>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`h-3.5 w-3.5 ${n <= r.rating ? "fill-orange text-orange" : "text-muted-foreground/40"}`}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="max-w-md pr-3">
                    <p className="line-clamp-3 text-xs text-muted-foreground">{r.comment}</p>
                  </td>
                  <td className="text-xs text-muted-foreground">{formatDate(r.reviewDate)}</td>
                  <td className="pr-4">
                    <div className="flex justify-end">
                      <button
                        onClick={() => onDelete(r)}
                        disabled={remove.isPending}
                        className="grid h-8 w-8 place-items-center rounded-full hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                        title="Delete review"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    {items.length === 0
                      ? "No reviews to moderate yet."
                      : "No reviews match your filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}