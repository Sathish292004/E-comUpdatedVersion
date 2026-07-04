import { createFileRoute, Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/store/AppContext";
import { LayoutDashboard, Package, FolderTree, Receipt, Users, Star, ArrowLeft, Bell, Search, Settings as SettingsIcon, LogOut, BarChart3, UserCircle, Menu, X, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/format";
import { ADMIN_SESSION_KEY } from "./admin.login";
import { useStoreSettings } from "@/hooks/use-store-settings";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — SK" }] }),
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/orders", label: "Orders", icon: Receipt },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/categories", label: "Categories", icon: FolderTree },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
  { to: "/admin/profile", label: "Profile", icon: UserCircle },
];

function AdminLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, login, logout, theme, setTheme } = useApp();
  const settings = useStoreSettings();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [path]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mobileOpen]);

  const isLoginPage = path === "/admin/login";

  // Rehydrate admin session from sessionStorage (temporary frontend-only
  // mechanism — replace with JWT verification once Spring Security ships).
  useEffect(() => {
    if (user || isLoginPage) return;
    try {
      const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.role === "admin") {
          login(parsed);
          return;
        }
      }
    } catch {}
  }, [user, isLoginPage, login]);

  const allowed = !!user && user.role === "admin";
  useEffect(() => {
    if (isLoginPage) return;
    // Allow one tick for the rehydrate effect above to run.
    if (!allowed) {
      const t = setTimeout(() => {
        if (!sessionStorage.getItem(ADMIN_SESSION_KEY)) {
          navigate({ to: "/admin/login", replace: true });
        }
      }, 0);
      return () => clearTimeout(t);
    }
  }, [allowed, isLoginPage, navigate]);

  const onLogout = () => {
    try { sessionStorage.removeItem(ADMIN_SESSION_KEY); } catch {}
    logout();
    navigate({ to: "/admin/login", replace: true });
  };

  // Render the login page WITHOUT the guarded sidebar shell.
  if (isLoginPage) return <Outlet />;

  if (!allowed) {
    return (
      <div className="grid min-h-screen place-items-center bg-secondary/40 p-6 text-center">
        <div>
          <h1 className="text-2xl font-black">Admin access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You must be signed in as an administrator to view this page.
          </p>
          <Link
            to="/admin/login"
            className="mt-5 inline-flex rounded-full bg-gradient-cta px-5 py-2.5 text-sm font-bold text-white shadow-glow"
          >
            Go to admin sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[260px_1fr] bg-secondary/40">
      <aside className="hidden border-r bg-background lg:flex lg:flex-col">
        <div className="flex items-center gap-2 border-b px-5 py-4">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt={settings.storeName} className="h-9 w-9 rounded-xl object-cover shadow-soft" />
          ) : (
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-white font-black shadow-soft">{(settings.storeName || "SK").charAt(0).toUpperCase()}</div>
          )}
          <span className="text-base font-black">{settings.storeName || "SK"}<span className="text-orange">.</span> <span className="text-xs font-semibold text-muted-foreground">admin</span></span>
        </div>
        <nav className="flex-1 p-3">
          {nav.map((n) => {
            const active = n.exact ? path === n.to : path.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} className={cn("flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition", active ? "bg-gradient-primary text-white shadow-soft" : "hover:bg-secondary")}>
                <n.icon className="h-4 w-4" />{n.label}
              </Link>
            );
          })}
        </nav>
        <div className="m-3 space-y-2">
          <button onClick={onLogout} className="inline-flex w-full items-center gap-2 rounded-xl border bg-background px-3 py-2 text-xs font-semibold hover:bg-destructive/10 hover:text-destructive">
            <LogOut className="h-3 w-3" />Sign out
          </button>
          <Link to="/" className="inline-flex w-full items-center gap-2 rounded-xl border bg-background px-3 py-2 text-xs font-semibold hover:bg-secondary"><ArrowLeft className="h-3 w-3" />Back to store</Link>
        </div>
      </aside>
      <div className="flex flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b bg-background/80 px-3 py-3 backdrop-blur-xl sm:gap-3 sm:px-4">
          <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-secondary lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Search…" className="w-full rounded-full border bg-background px-9 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo/20" />
          </div>
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-secondary"
            aria-label="Toggle theme"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={theme}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </motion.span>
            </AnimatePresence>
          </button>
          <button className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-secondary"><Bell className="h-4 w-4" /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-orange" /></button>
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-primary text-xs font-bold text-white">AS</div>
        </header>
        <motion.main key={path} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex-1 p-4 sm:p-6">
          <Outlet />
        </motion.main>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
          >
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 28, stiffness: 240 }}
              onClick={(e) => e.stopPropagation()}
              className="flex h-full w-72 max-w-[85%] flex-col bg-background shadow-card"
            >
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div className="flex items-center gap-2">
                  {settings.logoUrl ? (
                    <img src={settings.logoUrl} alt={settings.storeName} className="h-9 w-9 rounded-xl object-cover shadow-soft" />
                  ) : (
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-white font-black shadow-soft">{(settings.storeName || "SK").charAt(0).toUpperCase()}</div>
                  )}
                  <span className="text-base font-black">{settings.storeName || "SK"}<span className="text-orange">.</span> <span className="text-xs font-semibold text-muted-foreground">admin</span></span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                    className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"
                    aria-label="Toggle theme"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={theme}
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                      </motion.span>
                    </AnimatePresence>
                  </button>
                  <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <nav className="flex-1 overflow-y-auto p-3">
                {nav.map((n) => {
                  const active = n.exact ? path === n.to : path.startsWith(n.to);
                  return (
                    <Link key={n.to} to={n.to} onClick={() => setMobileOpen(false)} className={cn("flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition", active ? "bg-gradient-primary text-white shadow-soft" : "hover:bg-secondary")}>
                      <n.icon className="h-4 w-4" />{n.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="m-3 space-y-2">
                <button onClick={() => { setMobileOpen(false); onLogout(); }} className="inline-flex w-full items-center gap-2 rounded-xl border bg-background px-3 py-2 text-xs font-semibold hover:bg-destructive/10 hover:text-destructive">
                  <LogOut className="h-3 w-3" />Sign out
                </button>
                <Link to="/" onClick={() => setMobileOpen(false)} className="inline-flex w-full items-center gap-2 rounded-xl border bg-background px-3 py-2 text-xs font-semibold hover:bg-secondary"><ArrowLeft className="h-3 w-3" />Back to store</Link>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
