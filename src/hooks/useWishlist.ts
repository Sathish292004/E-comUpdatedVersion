import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { wishlistApi } from "@/lib/api/wishlist";
import { useApp } from "@/lib/store/AppContext";
import { toast } from "sonner";

function toProductId(id: string | number): number | null {
  const n = typeof id === "number" ? id : Number(String(id).replace(/\D+/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function useWishlist() {
  const { user } = useApp();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["wishlist"],
    queryFn: wishlistApi.list,
    enabled: !!user,
  });

  const ids = new Set((list.data ?? []).map((w) => w.productId));

  const invalidate = () => qc.invalidateQueries({ queryKey: ["wishlist"] });

  const add = useMutation({
    mutationFn: (productId: number) => wishlistApi.add(productId),
    onSuccess: invalidate,
    onError: (e: { message?: string }) => toast.error(e?.message ?? "Failed to add to wishlist"),
  });

  const remove = useMutation({
    mutationFn: (productId: number) => wishlistApi.remove(productId),
    onSuccess: invalidate,
    onError: (e: { message?: string }) => toast.error(e?.message ?? "Failed to remove from wishlist"),
  });

  const isWished = (id: string | number) => {
    const pid = toProductId(id);
    return pid != null && ids.has(pid);
  };

  const toggle = (id: string | number) => {
    if (!user) {
      toast.error("Please sign in to use your wishlist");
      return;
    }
    const pid = toProductId(id);
    if (pid == null) {
      toast.error("Invalid product");
      return;
    }
    if (ids.has(pid)) {
      remove.mutate(pid, { onSuccess: () => toast.success("Removed from wishlist") });
    } else {
      add.mutate(pid, { onSuccess: () => toast.success("Added to wishlist") });
    }
  };

  return { list, isWished, toggle, add, remove };
}