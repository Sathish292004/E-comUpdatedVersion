import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Minus, Plus, Share2, ShoppingBag, Truck, Shield, RefreshCcw, Star, Check } from "lucide-react";
import { getProduct, listProducts } from "@/lib/api/products";
import { ProductReviews } from "@/components/product/ProductReviews";
import type { Product } from "@/lib/api/mock-data";
import { ProductCard } from "@/components/product/ProductCard";
import { useApp } from "@/lib/store/AppContext";
import { useWishlist } from "@/hooks/useWishlist";
import { formatINR, cn } from "@/lib/format";
import { productImage, discountPct, prodMrp, prodRating, prodReviews, prodStock, prodColors, prodSizes, prodSpecs } from "@/lib/api/helpers";
import { SmartImage } from "@/components/ui/SmartImage";
import { loadProductGallery, loadProductFullSources } from "@/lib/admin-settings";
import { buildSources } from "@/lib/image-utils";
import { toast } from "sonner";

export const Route = createFileRoute("/product/$id")({
  head: () => ({ meta: [{ title: "Product — SK" }] }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { addToCart, addRecent } = useApp();
  const { isWished, toggle } = useWishlist();
  const { data: product } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProduct(id),
  });
  const { data: allProducts = [] } = useQuery({
    queryKey: ["products"],
    queryFn: listProducts,
  });
  const related = allProducts.filter((p) => p.id !== id).slice(0, 4);
  const [idx, setIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState<string | undefined>();
  const [color, setColor] = useState<string | undefined>();
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    setIdx(0); setQty(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);
  useEffect(() => {
    if (product) {
      setColor(prodColors(product)[0]);
      setSize(prodSizes(product)[0]);
      addRecent(product);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  if (!product) return <div className="mx-auto max-w-7xl px-4 py-20"><div className="h-[60vh] animate-pulse rounded-3xl bg-muted" /></div>;

  const off = discountPct(product);
  const colors = prodColors(product);
  const sizes = prodSizes(product);
  const specs = prodSpecs(product);
  const stock = prodStock(product);
  const rating = prodRating(product);
  const reviewCount = prodReviews(product);
  const base = product.images?.length ? product.images : [productImage(product, 0)];
  const extras = loadProductGallery(product.id);
  // When admin has saved a local gallery, it already contains the "main" image
  // as its first entry, so use it as-is to avoid the backend copy duplicating it.
  const images = extras.length ? Array.from(new Set(extras)) : Array.from(new Set(base));
  const localSources = loadProductFullSources(product.id);
  const sourcesFor = (i: number) => buildSources(localSources[i]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Home</Link><span className="mx-1.5 opacity-50">/</span>
        <Link to="/shop" className="hover:text-foreground">Shop</Link><span className="mx-1.5 opacity-50">/</span>
        <Link to="/shop" search={{ category: product.category } as any} className="hover:text-foreground">{product.category}</Link><span className="mx-1.5 opacity-50">/</span>
        <span className="font-semibold text-foreground">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="lg:sticky lg:top-24 self-start">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="group overflow-hidden rounded-3xl bg-white aspect-square shadow-card relative cursor-zoom-in" onClick={() => setZoom(true)}>
            <AnimatePresence mode="wait">
              <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="absolute inset-0">
                <SmartImage
                  src={images[idx] ?? images[0]}
                  alt={product.name}
                  eager
                  hoverScale
                  fit="contain"
                  wrapperClassName="h-full w-full bg-white p-6 sm:p-10"
                  sizes="(min-width: 1024px) 600px, 100vw"
                  sources={sourcesFor(idx)}
                />
              </motion.div>
            </AnimatePresence>
            {off > 0 && <span className="absolute left-4 top-4 rounded-full bg-gradient-cta px-3 py-1 text-xs font-bold text-white shadow-soft">-{off}%</span>}
          </motion.div>
          <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
            {images.map((src, i) => (
              <button key={i} onClick={() => setIdx(i)} className={cn("h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition", idx === i ? "border-indigo" : "border-transparent opacity-70")}>
                <SmartImage src={src} alt="" wrapperClassName="h-full w-full" sources={sourcesFor(i)} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{product.brand}</p>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{product.name}</h1>
            <div className="flex items-center gap-3 text-sm">
              {rating > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-emerald/15 px-2 py-1 text-emerald"><Star className="h-3.5 w-3.5 fill-emerald" />{rating}</span>}
              {reviewCount > 0 && <span className="text-muted-foreground">{reviewCount.toLocaleString()} reviews</span>}
              {(rating > 0 || reviewCount > 0) && <span className="text-muted-foreground">·</span>}
              <span className={cn("font-semibold", stock > 10 ? "text-emerald" : stock > 0 ? "text-orange" : "text-destructive")}>{stock > 10 ? "In stock" : stock > 0 ? `Only ${stock} left` : "Out of stock"}</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black">{formatINR(product.price)}</span>
              {off > 0 && <span className="text-base text-muted-foreground line-through">{formatINR(prodMrp(product))}</span>}
              {off > 0 && <span className="rounded-full bg-emerald/15 px-2 py-0.5 text-xs font-bold text-emerald">{off}% off</span>}
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{product.description ?? ""}</p>

            {colors.length > 0 && <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Color</p>
              <div className="flex gap-2">
                {colors.map((c) => (
                  <button key={c} onClick={() => setColor(c)} aria-label={c} className={cn("h-9 w-9 rounded-full border-2 transition", color === c ? "border-foreground shadow-soft" : "border-border")}>
                    <span className="block h-full w-full rounded-full" style={{ background: c }} />
                  </button>
                ))}
              </div>
            </div>}

            {sizes.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Size</p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <button key={s} onClick={() => setSize(s)} className={cn("min-w-12 rounded-xl border px-3 py-2 text-sm font-semibold transition", size === s ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/50")}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-3">
              <div className="flex items-center rounded-full border bg-background">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-11 w-11 place-items-center"><Minus className="h-4 w-4" /></button>
                <span className="w-8 text-center text-sm font-bold">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="grid h-11 w-11 place-items-center"><Plus className="h-4 w-4" /></button>
              </div>
              <button onClick={() => { addToCart(product, { qty, size, color }); toast.success("Added to cart"); }} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background shadow-soft transition hover:scale-[1.01] sm:flex-none">
                <ShoppingBag className="h-4 w-4" /> Add to cart
              </button>
              <button onClick={() => { addToCart(product, { qty, size, color }); navigate({ to: "/checkout" }); }} className="inline-flex flex-1 items-center justify-center rounded-full bg-gradient-cta px-6 py-3 text-sm font-bold text-white shadow-glow transition hover:scale-[1.01] sm:flex-none">
                Buy now
              </button>
              <button onClick={() => toggle(product.id)} className="grid h-12 w-12 place-items-center rounded-full border bg-background hover:bg-secondary" aria-label="Wishlist">
                <Heart className={cn("h-4 w-4", isWished(product.id) && "fill-destructive stroke-destructive")} />
              </button>
              <button onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success("Link copied"); }} className="grid h-12 w-12 place-items-center rounded-full border bg-background hover:bg-secondary" aria-label="Share">
                <Share2 className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              {[[Truck, "Free shipping"], [Shield, "Secure pay"], [RefreshCcw, "30-day returns"]].map(([Icon, label], i) => (
                <div key={i} className="flex items-center gap-2 rounded-2xl bg-secondary/60 px-3 py-2.5 text-xs">
                  {/* @ts-ignore */}
                  <Icon className="h-4 w-4 text-indigo" /><span className="font-semibold">{label}</span>
                </div>
              ))}
            </div>

            {specs.length > 0 && <div className="pt-6">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Specifications</h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-2xl border bg-card p-4 text-sm">
                {specs.map((s) => (
                  <div key={s.label} className="flex justify-between border-b py-1.5 last:border-b-0 col-span-2 sm:col-span-1 sm:last:border-b">
                    <dt className="text-muted-foreground">{s.label}</dt><dd className="font-semibold">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>}
          </motion.div>
        </div>
      </div>

      <ProductReviews productId={id} />

      <section className="mt-16">
        <h2 className="text-2xl font-black">Frequently bought together</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {related.slice(0, 3).map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="flex items-center gap-3 rounded-3xl bg-card p-3 shadow-card">
              <SmartImage src={productImage(p)} alt={p.name} wrapperClassName="h-20 w-20 shrink-0 rounded-2xl" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.brand}</p>
                <Link to="/product/$id" params={{ id: p.id }} className="line-clamp-1 text-sm font-bold hover:underline">{p.name}</Link>
                <p className="text-sm font-black">{formatINR(p.price)}</p>
              </div>
              <button onClick={() => { addToCart(p); toast.success("Added"); }} className="grid h-10 w-10 place-items-center rounded-full bg-foreground text-background hover:scale-105 transition"><Plus className="h-4 w-4" /></button>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-black">You might also like</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>

      <AnimatePresence>
        {zoom && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setZoom(false)} className="fixed inset-0 z-50 grid cursor-zoom-out place-items-center bg-foreground/95 p-6">
            <motion.img layoutId={`zoom-${idx}`} src={images[idx] ?? images[0]} className="max-h-full max-w-full rounded-2xl" alt="" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
