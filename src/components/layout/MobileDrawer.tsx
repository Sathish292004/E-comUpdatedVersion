import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { X, Home, Store, Heart, ShoppingBag, User, LayoutDashboard } from "lucide-react";
import { useApp } from "@/lib/store/AppContext";
import { useQuery } from "@tanstack/react-query";
import { categoriesApi, type Category } from "@/lib/api/categories";

const baseLinks = [
  { to: "/", label: "Home", icon: Home },
  { to: "/shop", label: "Shop all", icon: Store },
  { to: "/wishlist", label: "Wishlist", icon: Heart },
  { to: "/cart", label: "Cart", icon: ShoppingBag },
  { to: "/account", label: "Account", icon: User },
];

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useApp();
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.list,
    staleTime: 0,
    refetchOnMount: "always",
  });
  const links = user?.role === "admin"
    ? [...baseLinks, { to: "/admin", label: "Admin", icon: LayoutDashboard }]
    : baseLinks;
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm" />
          <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 280, damping: 32 }} className="fixed left-0 top-0 z-50 h-full w-[85%] max-w-sm bg-background shadow-glow">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <span className="text-lg font-black">SK<span className="text-orange">.</span></span>
              <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"><X className="h-4 w-4" /></button>
            </div>
            <nav className="p-3">
              {links.map((l, i) => (
                <motion.div key={l.label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                  <Link to={l.to} onClick={onClose} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-secondary">
                    <l.icon className="h-4 w-4" />{l.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div className="px-5 pt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categories</div>
            <div className="grid grid-cols-2 gap-2 p-3">
              {categories.map((c: Category, i: number) => (
                <motion.div key={c.slug} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.03 }}>
                  <Link to="/shop" search={{ category: c.slug } as any} onClick={onClose} className="block rounded-xl bg-secondary/60 px-3 py-3 text-sm font-semibold hover:bg-secondary">{c.name}</Link>
                </motion.div>
              ))}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
