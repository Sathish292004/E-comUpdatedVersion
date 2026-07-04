import { useEffect, useState } from "react";
import { loadSettings, type StoreSettings } from "@/lib/admin-settings";

const DEBUG =
  typeof window !== "undefined" &&
  (window.location.search.includes("debug=settings") ||
    localStorage.getItem("sk_debug_settings") === "1");

function dlog(...args: unknown[]) {
  if (DEBUG) console.log("%c[sk:settings]", "color:#f97316;font-weight:bold", ...args);
}

/**
 * Live store settings. Re-renders whenever an admin saves Settings
 * (same tab via `sk:settings` CustomEvent, other tabs via `storage`).
 * Backend-ready: swap `loadSettings()` for a fetch when the API exists.
 */
export function useStoreSettings(): StoreSettings {
  const [s, setS] = useState<StoreSettings>(() => {
    const v = loadSettings();
    dlog("initial load", { logoUrl: !!v.logoUrl, bannerUrl: !!v.bannerUrl, storeName: v.storeName });
    return v;
  });
  useEffect(() => {
    const sync = (source: string) => {
      const v = loadSettings();
      dlog(`storage sync (${source})`, { logoUrl: !!v.logoUrl, bannerUrl: !!v.bannerUrl });
      setS(v);
    };
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent<StoreSettings>).detail;
      dlog("received sk:settings event", {
        hasDetail: !!detail,
        logoUrl: !!detail?.logoUrl,
        bannerUrl: !!detail?.bannerUrl,
      });
      if (detail) setS(detail); else sync("event");
    };
    window.addEventListener("sk:settings", onCustom as EventListener);
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key !== "sk_store_settings_v1") return;
      sync("cross-tab");
    };
    window.addEventListener("storage", onStorage);
    // Reflect favicon if a logo is configured.
    return () => {
      window.removeEventListener("sk:settings", onCustom as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!s.logoUrl) return;
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = s.logoUrl;
  }, [s.logoUrl]);

  return s;
}