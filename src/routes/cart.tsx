import { SmartImage } from "@/components/ui/SmartImage";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, Tag, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/lib/store/AppContext";
import { formatINR } from "@/lib/format";
import { productImage } from "@/lib/api/helpers";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your bag — SK" }] }),
  component: CartPage,
});

function CartPage() {
  const { cart, removeFromCart, setQty, subtotal } = useApp();
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const ship = subtotal >= 1499 ? 0 : 99;
  const total = Math.max(0, subtotal - discount + ship);

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] bg-card p-12 text-center shadow-card">
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }} className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-gradient-hero ring-1 ring-border/60"><ShoppingBag className="h-10 w-10 text-primary dark:text-background/80" /></motion.div>
          <h1 className="mt-6 text-2xl font-black">Your bag is empty</h1>
          <p className="mt-1 text-sm text-muted-foreground">Looks like you haven't added anything yet.</p>
          <Link to="/shop" className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-cta px-6 py-3 text-sm font-bold text-white shadow-glow">Start shopping <ArrowRight className="h-4 w-4" /></Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-black sm:text-4xl">Shopping bag</h1>
      <p className="mt-1 text-sm text-muted-foreground">{cart.length} {cart.length === 1 ? "item" : "items"} in your bag</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {cart.map((c) => (
              <motion.li key={`${c.product.id}-${c.size}-${c.color}`} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 50 }} className="flex gap-4 rounded-2xl border bg-card p-4 shadow-card">
                <SmartImage src={productImage(c.product)} alt={c.product.name} wrapperClassName="h-28 w-28 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{c.product.brand}</p>
                  <Link to="/product/$id" params={{ id: c.product.id }} className="line-clamp-1 text-base font-bold hover:underline">{c.product.name}</Link>
                  {(c.size || c.color) && <p className="mt-0.5 text-xs text-muted-foreground">{[c.size && `Size ${c.size}`, c.color && `Color`].filter(Boolean).join(" · ")}</p>}
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center rounded-full border bg-background">
                      <button onClick={() => setQty(c.product.id, c.qty - 1)} className="grid h-9 w-9 place-items-center"><Minus className="h-3.5 w-3.5" /></button>
                      <span className="w-7 text-center text-sm font-bold">{c.qty}</span>
                      <button onClick={() => setQty(c.product.id, c.qty + 1)} className="grid h-9 w-9 place-items-center"><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-black">{formatINR(c.product.price * c.qty)}</span>
                      <button onClick={() => removeFromCart(c.product.id)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-destructive/10 hover:text-destructive transition"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        <aside className="lg:sticky lg:top-24 self-start space-y-4">
          <div className="rounded-2xl border bg-card p-5 shadow-card">
            <h2 className="text-lg font-bold">Order summary</h2>
            <div className="mt-3 flex items-center gap-2">
              <Tag className="h-4 w-4 text-indigo" />
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Enter promo code" className="flex-1 rounded-full border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo" />
              <button onClick={() => {
                if (code === "WELCOME10") { setDiscount(Math.round(subtotal * 0.1)); toast.success("WELCOME10 applied — 10% off"); }
                else if (code === "SK500") { setDiscount(500); toast.success("SK500 applied — ₹500 off"); }
                else { setDiscount(0); toast.error("Invalid code"); }
              }} className="rounded-full bg-foreground px-4 py-2 text-xs font-bold text-background">Apply</button>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Subtotal" value={formatINR(subtotal)} />
              {discount > 0 && <Row label="Discount" value={`- ${formatINR(discount)}`} accent />}
              <Row label="Shipping" value={ship === 0 ? "Free" : formatINR(ship)} accent={ship === 0} />
              <Row label="Estimated tax" value="Calculated at checkout" small />
            </dl>
            <div className="mt-3 flex items-baseline justify-between border-t pt-3">
              <span className="text-base font-bold">Total</span>
              <span className="text-2xl font-black">{formatINR(total)}</span>
            </div>
            <Link to="/checkout" className="mt-4 flex items-center justify-center gap-2 rounded-full bg-gradient-cta px-6 py-3 text-sm font-bold text-white shadow-glow transition hover:scale-[1.02]">Proceed to checkout <ArrowRight className="h-4 w-4" /></Link>
            <p className="mt-3 text-center text-xs text-muted-foreground">Estimated delivery <span className="font-semibold text-foreground">in 2–4 days</span></p>
          </div>
          <div className="rounded-2xl bg-gradient-hero p-4 text-xs text-foreground/80">
            <p className="font-bold">Free shipping on orders ₹1,499+</p>
            <p>Try <b>WELCOME10</b> for 10% off your first order.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, accent, small }: { label: string; value: string; accent?: boolean; small?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`${accent ? "text-emerald font-bold" : "font-semibold"} ${small ? "text-xs text-muted-foreground" : ""}`}>{value}</dd>
    </div>
  );
}
