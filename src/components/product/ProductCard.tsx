import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Eye } from "lucide-react";
import { useApp } from "@/lib/store/AppContext";
import { useWishlist } from "@/hooks/useWishlist";
import { formatINR, cn } from "@/lib/format";
import type { Product } from "@/lib/api/mock-data";
import { productImage, discountPct, prodMrp, prodRating, prodReviews } from "@/lib/api/helpers";
import { SmartImage } from "@/components/ui/SmartImage";
import { loadProductListingSources } from "@/lib/admin-settings";
import { buildSources } from "@/lib/image-utils";
import { toast } from "sonner";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { addToCart } = useApp();
  const { isWished, toggle } = useWishlist();
  const off = discountPct(product);
  const wished = isWished(product.id);
  const listing = loadProductListingSources(product.id);
  const slot0 = listing[0];
  const img0 = slot0?.jpeg ?? productImage(product, 0);
  const sources0 = buildSources(slot0);
  const rating = prodRating(product);
  const reviews = prodReviews(product);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.4), ease: [0.22, 1, 0.36, 1] }}
      className="group relative"
    >
      <Link to="/product/$id" params={{ id: product.id }} className="block">
        <div className="relative overflow-hidden rounded-2xl bg-secondary aspect-[4/5] shadow-card">
          <SmartImage
            src={img0}
            alt={product.name}
            wrapperClassName="absolute inset-0 bg-transparent"
            fit="cover"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            sources={sources0}
            hoverScale
          />
          {/* second-image hover swap removed: it pulled in unrelated product images on touch */}

          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {product.isNew && <span className="rounded-full bg-foreground/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-background">New</span>}
            {product.isBestseller && <span className="rounded-full bg-emerald px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">Bestseller</span>}
            {off > 0 && <span className="rounded-full bg-gradient-cta px-2.5 py-1 text-[10px] font-bold text-white shadow-soft">-{off}%</span>}
          </div>

          <button
            type="button"
            onClick={(e) => { e.preventDefault(); toggle(product.id); }}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full glass shadow-soft transition hover:scale-110"
            aria-label="Toggle wishlist"
          >
            <Heart className={cn("h-4 w-4", wished ? "fill-destructive stroke-destructive" : "stroke-foreground")} />
          </button>

          <motion.div
            initial={{ y: 16, opacity: 0 }}
            whileHover={{ y: 0, opacity: 1 }}
            className="absolute inset-x-3 bottom-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0"
          >
            <button
              onClick={(e) => { e.preventDefault(); addToCart(product); toast.success("Added to cart"); }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-foreground/90 px-3 py-2.5 text-xs font-semibold text-background backdrop-blur transition hover:bg-foreground"
            >
              <ShoppingBag className="h-3.5 w-3.5" /> Add to cart
            </button>
            <span className="grid h-10 w-10 place-items-center rounded-xl glass shadow-soft" aria-hidden="true">
              <Eye className="h-4 w-4" />
            </span>
          </motion.div>
        </div>

        <div className="mt-3 px-1">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{product.brand}</p>
          <h3 className="mt-0.5 line-clamp-1 text-sm font-semibold text-foreground">{product.name}</h3>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-base font-bold text-foreground">{formatINR(product.price)}</span>
            {off > 0 && <span className="text-xs text-muted-foreground line-through">{formatINR(prodMrp(product))}</span>}
            {off > 0 && <span className="text-xs font-semibold text-emerald">{off}% off</span>}
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            {rating > 0 && <><span className="text-amber-500">★</span>{rating} <span className="opacity-60">({reviews})</span></>}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
