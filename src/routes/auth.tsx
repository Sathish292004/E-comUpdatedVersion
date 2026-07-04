import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useStoreSettings } from "@/hooks/use-store-settings";

export const Route = createFileRoute("/auth")({ component: AuthLayout });

function AuthLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const settings = useStoreSettings();
  const brand = settings.storeName || "SK";
  return (
    <div className="grid min-h-[calc(100vh-200px)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-primary lg:block">
        {settings.bannerUrl ? (
          <img src={settings.bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
        ) : (
          <div className="absolute inset-0 bg-gradient-mesh opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-black/30 to-transparent" />
        <div className="relative grid h-full place-items-center p-12 text-white">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-md text-center">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt={brand} className="mx-auto h-14 w-14 rounded-2xl object-cover" />
            ) : (
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/15 backdrop-blur text-3xl font-black">{brand.charAt(0).toUpperCase()}</div>
            )}
            <h2 className="mt-6 text-4xl font-black">Welcome to {brand}.</h2>
            <p className="mt-3 text-white/85">Premium shopping, beautifully delivered. Join 50,000+ shoppers who choose SK for the things they actually love.</p>
            <div className="mt-10 grid grid-cols-3 gap-4 text-left">
              {["Free shipping over ₹1,499", "30-day easy returns", "Secure encrypted checkout"].map((t, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }} className="rounded-2xl bg-white/10 p-3 text-xs font-semibold backdrop-blur">{t}</motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
      <div className="grid place-items-center px-4 py-12 sm:px-12">
        <motion.div key={path} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full max-w-sm">
          <Link to="/" className="mb-6 inline-flex items-center gap-2 text-lg font-black">
            {settings.logoUrl && <img src={settings.logoUrl} alt={brand} className="h-7 w-7 rounded-lg object-cover" />}
            <span>{brand}<span className="text-orange">.</span></span>
          </Link>
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
}
