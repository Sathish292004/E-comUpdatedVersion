import { useEffect, useState } from "react";
import { loadSettings, type StoreSettings } from "@/lib/admin-settings";

type Entry = { t: string; src: string; logo: boolean; banner: boolean; name: string };

function enabled() {
  if (typeof window === "undefined") return false;
  return (
    window.location.search.includes("debug=settings") ||
    localStorage.getItem("sk_debug_settings") === "1"
  );
}

export function SettingsDebugPanel() {
  const [on, setOn] = useState(false);
  const [s, setS] = useState<StoreSettings | null>(null);
  const [log, setLog] = useState<Entry[]>([]);
  const [open, setOpen] = useState(true);

  useEffect(() => { setOn(enabled()); }, []);

  useEffect(() => {
    if (!on) return;
    const push = (src: string, v: StoreSettings) => {
      setS(v);
      setLog((p) => [
        { t: new Date().toLocaleTimeString(), src, logo: !!v.logoUrl, banner: !!v.bannerUrl, name: v.storeName },
        ...p,
      ].slice(0, 12));
    };
    const initial = loadSettings();
    push("initial", initial);

    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent<StoreSettings>).detail ?? loadSettings();
      push("sk:settings event", detail);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key !== "sk_store_settings_v1") return;
      push("storage (cross-tab)", loadSettings());
    };
    window.addEventListener("sk:settings", onCustom as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("sk:settings", onCustom as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, [on]);

  if (!on || !s) return null;

  return (
    <div className="fixed bottom-3 right-3 z-[9999] w-[320px] max-w-[calc(100vw-24px)] rounded-xl border border-orange-500/40 bg-black/85 p-3 text-[11px] font-mono text-white shadow-2xl backdrop-blur">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="font-bold text-orange-400">sk:settings · debug</div>
        <div className="flex gap-1">
          <button onClick={() => setOpen((v) => !v)} className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/20">{open ? "−" : "+"}</button>
          <button onClick={() => { localStorage.removeItem("sk_debug_settings"); setOn(false); }} className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/20">×</button>
        </div>
      </div>
      {open && (
        <>
          <div className="mb-2 grid grid-cols-2 gap-2">
            <div>
              <div className="text-white/60">Logo</div>
              {s.logoUrl ? <img src={s.logoUrl} alt="" className="mt-1 h-12 w-12 rounded-md border border-white/20 object-cover" /> : <div className="mt-1 grid h-12 w-12 place-items-center rounded-md border border-white/20 text-white/40">∅</div>}
            </div>
            <div>
              <div className="text-white/60">Banner</div>
              {s.bannerUrl ? <img src={s.bannerUrl} alt="" className="mt-1 h-12 w-full rounded-md border border-white/20 object-cover" /> : <div className="mt-1 grid h-12 w-full place-items-center rounded-md border border-white/20 text-white/40">∅</div>}
            </div>
          </div>
          <div className="mb-1 text-white/60">Store: <span className="text-white">{s.storeName}</span></div>
          <div className="mb-1 text-white/60">localStorage key: <span className="text-white">sk_store_settings_v1</span></div>
          <div className="mb-1 mt-2 text-white/60">Event log</div>
          <div className="max-h-40 space-y-1 overflow-auto rounded bg-white/5 p-1.5">
            {log.map((e, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <span className="text-white/50">{e.t}</span>
                <span className="truncate text-orange-300">{e.src}</span>
                <span className={e.logo ? "text-emerald-400" : "text-white/30"}>L</span>
                <span className={e.banner ? "text-emerald-400" : "text-white/30"}>B</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}