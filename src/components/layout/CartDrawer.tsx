import { SmartImage } from "@/components/ui/SmartImage";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useApp } from "@/lib/store/AppContext";
import { formatINR } from "@/lib/format";
import { productImage } from "@/lib/api/helpers";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { cart, removeFromCart, setQty, subtotal, cartCount } = useApp();
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm" />
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 280, damping: 32 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-background shadow-glow"
          >
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="text-lg font-bold">Your bag</h2>
                <p className="text-xs text-muted-foreground">{cartCount} {cartCount === 1 ? "item" : "items"}</p>
              </div>
              <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"><X className="h-4 w-4" /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="grid h-20 w-20 place-items-center rounded-full bg-gradient-hero ring-1 ring-border/60">
                    <ShoppingBag className="h-8 w-8 text-primary dark:text-background/80" />
                  </motion.div>
                  <p className="mt-4 font-semibold">Your bag is empty</p>
                  <p className="mt-1 text-sm text-muted-foreground">Start adding things you love.</p>
                  <Link to="/shop" onClick={onClose} className="mt-5 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow-soft">Browse products</Link>
                </div>
              ) : (
                <ul className="space-y-4">
                  <AnimatePresence initial={false}>
                  {cart.map((item) => (
                    <motion.li
                      key={`${item.product.id}-${item.size}-${item.color}`}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 40 }}
                      className="flex gap-3 rounded-2xl bg-secondary/50 p-3"
                    >
                      <SmartImage src={productImage(item.product)} alt={item.product.name} wrapperClassName="h-20 w-20 shrink-0 rounded-xl" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{item.product.brand}</p>
                        <p className="line-clamp-1 text-sm font-semibold">{item.product.name}</p>
                        {(item.size || item.color) && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{[item.size, item.color].filter(Boolean).join(" · ")}</p>
                        )}
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="flex items-center rounded-full border bg-background">
                            <button onClick={() => setQty(item.product.id, item.qty - 1)} className="grid h-7 w-7 place-items-center"><Minus className="h-3 w-3" /></button>
                            <span className="w-6 text-center text-xs font-semibold">{item.qty}</span>
                            <button onClick={() => setQty(item.product.id, item.qty + 1)} className="grid h-7 w-7 place-items-center"><Plus className="h-3 w-3" /></button>
                          </div>
                          <span className="text-sm font-bold">{formatINR(item.product.price * item.qty)}</span>
                          <button onClick={() => removeFromCart(item.product.id)} className="grid h-7 w-7 place-items-center rounded-full hover:bg-destructive/10 hover:text-destructive transition"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t bg-card px-5 py-4">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-semibold">{formatINR(subtotal)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Shipping</span><span className="font-semibold text-emerald">{subtotal >= 1499 ? "Free" : formatINR(99)}</span></div>
                <div className="mt-2 flex items-baseline justify-between border-t pt-2"><span className="font-semibold">Total</span><span className="text-xl font-black">{formatINR(subtotal + (subtotal >= 1499 ? 0 : 99))}</span></div>
                <Link to="/checkout" onClick={onClose} className="mt-3 flex w-full items-center justify-center rounded-full bg-gradient-cta px-5 py-3 text-sm font-bold text-white shadow-glow">
                  Checkout
                </Link>
                <Link to="/cart" onClick={onClose} className="mt-2 flex w-full items-center justify-center rounded-full border bg-background px-5 py-2.5 text-sm font-semibold">View cart</Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
