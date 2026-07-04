import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Star, Trash2, Edit2, Check, X, Loader2 } from "lucide-react";
import { reviewsApi, type Review } from "@/lib/api/reviews";
import { useApp } from "@/lib/store/AppContext";
import { toast } from "sonner";
import { formatDate, cn } from "@/lib/format";

export function ProductReviews({ productId }: { productId: string | number }) {
  const { user } = useApp();
  const qc = useQueryClient();
  const key = ["reviews", String(productId)] as const;
  const { data, isLoading, error } = useQuery({ queryKey: key, queryFn: () => reviewsApi.listForProduct(productId) });

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: key });
  const add = useMutation({
    mutationFn: () => reviewsApi.add(productId, { rating, comment }),
    onSuccess: () => { toast.success("Review posted"); setComment(""); setRating(5); invalidate(); },
    onError: (e: { message?: string }) => toast.error(e?.message ?? "Failed"),
  });
  const update = useMutation({
    mutationFn: (id: number) => reviewsApi.update(id, { rating, comment }),
    onSuccess: () => { toast.success("Review updated"); setEditingId(null); setComment(""); setRating(5); invalidate(); },
    onError: (e: { message?: string }) => toast.error(e?.message ?? "Failed"),
  });
  const remove = useMutation({
    mutationFn: (id: number) => reviewsApi.remove(id),
    onSuccess: () => { toast.success("Review removed"); invalidate(); },
    onError: (e: { message?: string }) => toast.error(e?.message ?? "Failed"),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return toast.error("Write a short comment");
    if (editingId != null) update.mutate(editingId); else add.mutate();
  };
  const startEdit = (r: Review) => { setEditingId(r.id); setRating(r.rating); setComment(r.comment); };
  const cancelEdit = () => { setEditingId(null); setRating(5); setComment(""); };

  return (
    <section className="mt-16">
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl font-black">Reviews {data && <span className="text-sm font-normal text-muted-foreground">({data.totalReviews.toLocaleString()})</span>}</h2>
        {data?.averageRating != null && (
          <p className="flex items-center gap-1 text-sm font-bold"><Star className="h-4 w-4 fill-orange text-orange" />{data.averageRating.toFixed(1)} / 5</p>
        )}
      </div>

      {user ? (
        <form onSubmit={submit} className="mt-4 rounded-3xl border bg-card p-5 shadow-card">
          <p className="text-sm font-bold">{editingId != null ? "Edit your review" : "Write a review"}</p>
          <div className="mt-3 flex items-center gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`} className="p-1">
                <Star className={cn("h-6 w-6", n <= rating ? "fill-orange text-orange" : "text-muted-foreground")} />
              </button>
            ))}
          </div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience…" rows={3} maxLength={1000}
            className="mt-3 w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20" />
          <div className="mt-3 flex gap-2">
            <button disabled={add.isPending || update.isPending} className="rounded-full bg-foreground px-5 py-2.5 text-sm font-bold text-background disabled:opacity-60">
              {editingId != null ? (update.isPending ? "Saving…" : "Save changes") : (add.isPending ? "Posting…" : "Post review")}
            </button>
            {editingId != null && <button type="button" onClick={cancelEdit} className="rounded-full border bg-background px-5 py-2.5 text-sm font-semibold">Cancel</button>}
          </div>
        </form>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Sign in to write a review.</p>
      )}

      {isLoading && <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading reviews…</div>}
      {error && <p className="mt-6 text-sm text-destructive">Could not load reviews.</p>}
      {data && data.reviews.length === 0 && !isLoading && <p className="mt-6 text-sm text-muted-foreground">No reviews yet — be the first.</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.reviews.map((r) => {
          const mine = user && user.name === r.customerName;
          return (
            <div key={r.id} className="rounded-3xl bg-card p-5 shadow-card">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-primary text-xs font-bold text-white">
                    {r.customerName.split(" ").filter(Boolean).map((s) => s[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-bold">{r.customerName}</p>
                    <p className="text-[10px] text-muted-foreground">{formatDate(r.reviewDate)}</p>
                  </div>
                </div>
                <div className="flex text-orange text-xs" aria-label={`${r.rating} out of 5`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={cn("h-3.5 w-3.5", i < r.rating ? "fill-orange" : "text-muted-foreground")} />
                  ))}
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{r.comment}</p>
              {mine && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => startEdit(r)} className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold"><Edit2 className="h-3 w-3" />Edit</button>
                  <button onClick={() => remove.mutate(r.id)} className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold text-destructive"><Trash2 className="h-3 w-3" />Delete</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="sr-only"><Check /><X /></p>
    </section>
  );
}
