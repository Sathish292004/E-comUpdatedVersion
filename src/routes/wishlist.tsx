import { SmartImage } from "@/components/ui/SmartImage";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Trash2, Loader2 } from "lucide-react";
import { useApp } from "@/lib/store/AppContext";
import { formatINR } from "@/lib/format";
import { productImage } from "@/lib/api/helpers";
import { toast } from "sonner";
import type { WishlistItem } from "@/lib/api/wishlist";
import { useWishlist } from "@/hooks/useWishlist";

export const Route = createFileRoute("/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist — SK" }] }),
  component: WishlistPage,
});

function WishlistPage() {
  const { user, addToCart } = useApp();
  const { list, remove } = useWishlist();
  const { data = [], isLoading, error } = list;

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <div className="rounded-[2rem] bg-card p-12 text-center shadow-card">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-destructive/10"><Heart className="h-10 w-10 text-destructive" /></div>
          <h1 className="mt-6 text-2xl font-black">Sign in to see your wishlist</h1>
          <Link to="/auth/login" className="mt-6 inline-flex rounded-full bg-gradient-cta px-6 py-3 text-sm font-bold text-white shadow-glow">Sign in</Link>
        </div>
      </div>
    );
  }
  if (isLoading) return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>;
  if (error) return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-destructive">Failed to load wishlist.</div>;

  if (data.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] bg-card p-12 text-center shadow-card">
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-destructive/10"><Heart className="h-10 w-10 text-destructive" /></motion.div>
          <h1 className="mt-6 text-2xl font-black">Your wishlist is empty</h1>
          <p className="mt-1 text-sm text-muted-foreground">Save your favourite items here for later.</p>
          <Link to="/shop" className="mt-6 inline-flex rounded-full bg-gradient-cta px-6 py-3 text-sm font-bold text-white shadow-glow">Browse products</Link>
        </motion.div>
      </div>
    );
  }

  const moveToCart = (w: WishlistItem) => {
    // Map the backend wishlist item into the app-store Product shape.
    addToCart({
      id: String(w.productId),
      name: w.productName,
      brand: w.brand,
      category: w.category,
      price: w.price,
      image: productImage({ id: String(w.productId), name: w.productName, image: w.imageName ?? undefined } as never),
      description: "",
      rating: 0,
      reviews: 0,
    } as never);
    remove.mutate(w.productId);
    toast.success("Moved to cart");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-black sm:text-4xl">Wishlist</h1>
      <p className="mt-1 text-sm text-muted-foreground">{data.length} saved {data.length === 1 ? "item" : "items"}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((p, i) => (
          <motion.div key={p.productId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="flex gap-4 rounded-3xl border bg-card p-4 shadow-card">
            <Link to="/product/$id" params={{ id: String(p.productId) }} className="shrink-0">
              <SmartImage src={productImage({ id: String(p.productId), name: p.productName, image: p.imageName ?? undefined } as never)} alt={p.productName} wrapperClassName="h-28 w-28 rounded-2xl" />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.brand}</p>
              <Link to="/product/$id" params={{ id: String(p.productId) }} className="line-clamp-2 text-sm font-bold hover:underline">{p.productName}</Link>
              <p className="mt-1 text-base font-black">{formatINR(p.price)}</p>
              <div className="mt-3 flex gap-2">
                <button disabled={!p.productAvailable} onClick={() => moveToCart(p)} className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-xs font-bold text-background disabled:opacity-50"><ShoppingBag className="h-3.5 w-3.5" />Move to cart</button>
                <button onClick={() => remove.mutate(p.productId)} className="grid h-8 w-8 place-items-center rounded-full border hover:bg-destructive/10 hover:text-destructive transition"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
