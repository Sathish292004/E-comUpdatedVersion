import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Menu, Search, ShoppingBag, User, X, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/store/AppContext";
import { CartDrawer } from "./CartDrawer";
import { SearchOverlay } from "./SearchOverlay";
import { MobileDrawer } from "./MobileDrawer";
import { cn } from "@/lib/format";
import { useStoreSettings } from "@/hooks/use-store-settings";

const nav = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/categories", label: "Categories" },
  { to: "/shop", label: "New", search: { sort: "new" as const } },
  { to: "/shop", label: "Sale", search: { sort: "sale" as const } },
];

export function Navbar() {
  const { cartCount, wishlist, theme, setTheme, user } = useApp();
  const settings = useStoreSettings();
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="h-1 w-full bg-gradient-cta" />
      <div className="bg-foreground text-background">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-4 px-4 py-1.5 text-[11px] tracking-wide">
          <span className="opacity-90">Free shipping over ₹1,499</span>
          <span className="hidden sm:inline opacity-60">•</span>
          <span className="hidden sm:inline opacity-90">Easy 30-day returns</span>
          <span className="hidden md:inline opacity-60">•</span>
          <span className="hidden md:inline opacity-90">Use <b>WELCOME10</b> for 10% off your first order</span>
        </div>
      </div>

      <header className={cn("sticky top-0 z-40 transition-all", scrolled ? "glass-nav shadow-soft" : "bg-background")}>
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-6">
          <button className="md:hidden -ml-2 p-2" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>

          <Link to="/" className="flex items-center gap-2 shrink-0">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt={settings.storeName} className="h-9 w-9 rounded-xl object-cover shadow-soft" />
            ) : (
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-white font-black shadow-soft">
                {(settings.storeName || "SK").charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-lg font-black tracking-tight">{settings.storeName || "SK"}<span className="text-orange">.</span></span>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {nav.map((n, i) => (
              <Link
                key={i}
                to={n.to}
                search={n.search as any}
                className={cn(
                  "relative px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition",
                  path === n.to && !n.search ? "text-foreground" : ""
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => setSearchOpen(true)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-secondary transition" aria-label="Search">
              <Search className="h-[18px] w-[18px]" />
            </button>
            <button onClick={() => setTheme(theme === "light" ? "dark" : "light")} className="hidden sm:grid h-10 w-10 place-items-center rounded-full hover:bg-secondary transition" aria-label="Toggle theme">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  {theme === "light" ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
                </motion.span>
              </AnimatePresence>
            </button>
            <Link to="/wishlist" className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-secondary transition" aria-label="Wishlist">
              <Heart className="h-[18px] w-[18px]" />
              {wishlist.length > 0 && <Badge n={wishlist.length} />}
            </Link>
            <Link to={user ? "/account" : "/auth/login"} className="hidden sm:grid h-10 w-10 place-items-center rounded-full hover:bg-secondary transition" aria-label="Account">
              <User className="h-[18px] w-[18px]" />
            </Link>
            <button onClick={() => setCartOpen(true)} className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-secondary transition" aria-label="Cart">
              <ShoppingBag className="h-[18px] w-[18px]" />
              {cartCount > 0 && <Badge n={cartCount} accent />}
            </button>
          </div>
        </div>
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}

function Badge({ n, accent = false }: { n: number; accent?: boolean }) {
  return (
    <motion.span
      key={n}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn("absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-bold text-white", accent ? "bg-gradient-cta" : "bg-foreground")}
    >
      {n}
    </motion.span>
  );
}
