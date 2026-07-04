import { SmartImage } from "@/components/ui/SmartImage";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, TrendingUp, Clock, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchProducts } from "@/lib/api/products";
import { formatINR } from "@/lib/format";
import { productImage } from "@/lib/api/helpers";

const TRENDING = ["Running shoes", "Wireless earbuds", "Smartwatch", "Slim fit jeans", "Aviators"];
const RECENT_KEY = "recent_searches";

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [debouncedQ, setDebouncedQ] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    try { setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) || "[]")); } catch {}
    setQ(""); setDebouncedQ("");
  }, [open]);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q.trim()), 180);
    return () => clearTimeout(id);
  }, [q]);

  const { data: results = [] } = useQuery({
    queryKey: ["products", "search", debouncedQ],
    queryFn: () => searchProducts(debouncedQ),
    enabled: !!debouncedQ,
  });

  const persistRecent = (term: string) => {
    if (!term.trim()) return;
    const next = [term, ...recent.filter((r) => r !== term)].slice(0, 6);
    setRecent(next);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  };

  const goToResults = (term: string) => {
    if (!term.trim()) return;
    persistRecent(term.trim());
    onClose();
    navigate({ to: "/search", search: { q: term.trim() } });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl">
          <div className="mx-auto max-w-3xl px-4 pt-10 sm:pt-20">
            <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3 shadow-soft">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") goToResults(q); }}
                placeholder="Search for products, brands, categories…"
                className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
                aria-label="Search"
              />
              <button onClick={onClose} aria-label="Close search" className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"><X className="h-4 w-4" /></button>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-6">
              {q.trim() === "" ? (
                <div className="grid gap-6 sm:grid-cols-2">
                  <Section icon={<TrendingUp className="h-4 w-4" />} title="Trending">
                    {TRENDING.map((t) => (
                      <button key={t} onClick={() => goToResults(t)} className="rounded-full border bg-background px-3 py-1.5 text-sm hover:bg-secondary">{t}</button>
                    ))}
                  </Section>
                  <Section icon={<Clock className="h-4 w-4" />} title="Recent">
                    {recent.length === 0 ? <p className="text-sm text-muted-foreground">No recent searches.</p> :
                      recent.map((t) => <button key={t} onClick={() => goToResults(t)} className="rounded-full border bg-background px-3 py-1.5 text-sm hover:bg-secondary">{t}</button>)}
                  </Section>
                </div>
              ) : results.length === 0 ? (
                <div className="rounded-2xl border bg-card p-10 text-center">
                  <p className="text-lg font-semibold">No results for "{q}"</p>
                  <p className="mt-1 text-sm text-muted-foreground">Try a different keyword or check the spelling.</p>
                </div>
              ) : (
                <ul className="overflow-hidden rounded-2xl border bg-card shadow-soft">
                  {results.slice(0, 8).map((p) => (
                    <li key={p.id}>
                      <Link to="/product/$id" params={{ id: p.id }} onClick={() => { persistRecent(q); onClose(); }} className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0 hover:bg-secondary/60">
                        <SmartImage src={productImage(p)} alt={p.name} wrapperClassName="h-12 w-12 rounded-lg" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{p.brand}</p>
                          <p className="line-clamp-1 text-sm font-semibold">{p.name}</p>
                        </div>
                        <span className="text-sm font-bold">{formatINR(p.price)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{icon}{title}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
