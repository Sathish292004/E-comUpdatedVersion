import { SmartImage } from "@/components/ui/SmartImage";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CreditCard, Truck, Smartphone, Banknote, Check } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/lib/store/AppContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "@/lib/api/profile";
import { formatINR, cn } from "@/lib/format";
import { productImage } from "@/lib/api/helpers";
import { createOrder, ordersQueryKeys } from "@/lib/api/orders";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — SK" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, subtotal, clearCart, user } = useApp();
  const queryClient = useQueryClient();
  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: profileApi.get,
    enabled: !!user,
    retry: false,
  });
  const [step, setStep] = useState(0);
  const [pay, setPay] = useState("card");
  const [submitting, setSubmitting] = useState(false);
  const ship = subtotal >= 1499 ? 0 : 99;
  const total = subtotal + ship;

  const onPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || submitting) return;
    if (!user) {
      toast.error("Please sign in to place an order");
      navigate({ to: "/auth/login" });
      return;
    }
    setSubmitting(true);
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    try {
      await createOrder({
        customerName: String(fd.get("fullName") ?? ""),
        email: String(fd.get("email") ?? ""),
        items: cart.map((c) => ({ productId: c.product.id, quantity: c.qty })),
      });
      clearCart();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["cart"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] }),
      ]);
      toast.success("Order placed!");
      navigate({ to: "/account/orders" });
    } catch (err: any) {
      toast.error(err?.message ?? "Could not place order");
    } finally {
      setSubmitting(false);
    }
  };

  const p = profile.data;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-black sm:text-4xl">Checkout</h1>
      <Steps step={step} />
      <form onSubmit={onPlace} className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border bg-card p-6 shadow-card">
            <h2 className="text-lg font-bold">Shipping address</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Input key={`n-${p?.name ?? ""}`} label="Full name" name="fullName" required defaultValue={p?.name ?? ""} />
              <Input key={`p-${p?.phone ?? ""}`} label="Phone" name="phone" required type="tel" defaultValue={p?.phone ?? ""} />
              <Input key={`e-${p?.email ?? ""}`} label="Email" name="email" type="email" required className="sm:col-span-2" defaultValue={p?.email ?? ""} />
              <Input key={`a-${p?.address ?? ""}`} label="Address" name="address" required className="sm:col-span-2" defaultValue={p?.address ?? ""} />
              <Input label="City" name="city" required />
              <Input label="State" name="state" required />
              <Input label="Pincode" name="postalCode" required />
              <Input label="Country" name="country" required defaultValue="India" />
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-3xl border bg-card p-6 shadow-card">
            <h2 className="text-lg font-bold">Delivery</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <DeliveryOpt label="Standard" sub="3–5 business days" price="Free" checked />
              <DeliveryOpt label="Express" sub="1–2 business days" price={formatINR(199)} />
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-3xl border bg-card p-6 shadow-card">
            <h2 className="text-lg font-bold">Payment method</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {[
                { v: "card", label: "Credit / Debit card", Icon: CreditCard },
                { v: "upi", label: "UPI", Icon: Smartphone },
                { v: "netbanking", label: "Net banking", Icon: Banknote },
                { v: "cod", label: "Cash on delivery", Icon: Truck },
              ].map(({ v, label, Icon }) => (
                <button type="button" key={v} onClick={() => setPay(v)} className={cn("flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition", pay === v ? "border-indigo bg-accent/40" : "border-border hover:border-foreground/30")}>
                  <Icon className="h-5 w-5 text-indigo" />
                  <span className="text-sm font-semibold">{label}</span>
                </button>
              ))}
            </div>
            {pay === "card" && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Input label="Card number" placeholder="1234 5678 9012 3456" className="sm:col-span-2" />
                <Input label="Name on card" placeholder="As on card" />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Expiry" placeholder="MM/YY" />
                  <Input label="CVV" placeholder="•••" type="password" />
                </div>
              </div>
            )}
          </motion.section>
        </div>

        <aside className="lg:sticky lg:top-24 self-start space-y-4">
          <div className="rounded-3xl border bg-card p-5 shadow-card">
            <h2 className="text-lg font-bold">Order summary</h2>
            <ul className="mt-3 max-h-72 space-y-3 overflow-y-auto pr-1">
              {cart.map((c) => (
                <li key={c.product.id} className="flex items-center gap-3">
                  <SmartImage src={productImage(c.product)} alt={c.product.name} wrapperClassName="h-14 w-14 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold">{c.product.name}</p>
                    <p className="text-xs text-muted-foreground">Qty {c.qty}</p>
                  </div>
                  <span className="text-sm font-bold">{formatINR(c.product.price * c.qty)}</span>
                </li>
              ))}
              {cart.length === 0 && <p className="text-sm text-muted-foreground">Your cart is empty.</p>}
            </ul>
            <dl className="mt-4 space-y-2 border-t pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="font-semibold">{formatINR(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd className={ship === 0 ? "text-emerald font-bold" : "font-semibold"}>{ship === 0 ? "Free" : formatINR(ship)}</dd></div>
            </dl>
            <div className="mt-3 flex items-baseline justify-between border-t pt-3">
              <span className="font-bold">Total</span><span className="text-2xl font-black">{formatINR(total)}</span>
            </div>
            <button type="submit" disabled={cart.length === 0 || submitting} className="mt-4 w-full rounded-full bg-gradient-cta px-6 py-3 text-sm font-bold text-white shadow-glow transition hover:scale-[1.02] disabled:opacity-50">{submitting ? "Placing…" : "Place order"}</button>
            <p className="mt-3 text-center text-xs text-muted-foreground">By placing your order, you agree to our terms.</p>
          </div>
        </aside>
      </form>
    </div>
  );
}

function Steps({ step }: { step: number }) {
  const labels = ["Address", "Delivery", "Payment", "Review"];
  return (
    <div className="mt-6 flex items-center gap-2">
      {labels.map((l, i) => (
        <div key={l} className="flex flex-1 items-center gap-2">
          <div className={cn("grid h-7 w-7 place-items-center rounded-full text-xs font-bold", i <= step ? "bg-gradient-primary text-white" : "bg-secondary text-muted-foreground")}>{i + 1}</div>
          <span className={cn("text-xs font-semibold", i <= step ? "text-foreground" : "text-muted-foreground")}>{l}</span>
          {i < labels.length - 1 && <div className="ml-1 hidden h-px flex-1 bg-border sm:block" />}
        </div>
      ))}
    </div>
  );
}

function Input({ label, className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</span>
      <input {...props} className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-indigo focus:ring-2 focus:ring-indigo/20" />
    </label>
  );
}

function DeliveryOpt({ label, sub, price, checked = false }: { label: string; sub: string; price: string; checked?: boolean }) {
  const [c, setC] = useState(checked);
  return (
    <label onClick={() => setC(true)} className={cn("flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition", c ? "border-indigo bg-accent/40" : "border-border hover:border-foreground/30")}>
      <span className={cn("mt-0.5 grid h-5 w-5 place-items-center rounded-full border-2", c ? "border-indigo bg-indigo" : "border-border")}>{c && <Check className="h-3 w-3 text-white" />}</span>
      <div className="flex-1">
        <p className="text-sm font-bold">{label}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <span className="text-sm font-bold text-emerald">{price}</span>
    </label>
  );
}
