import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listProducts } from "@/lib/api/products";
import { categoriesApi, type Category } from "@/lib/api/categories";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductCardSkeleton } from "@/components/product/ProductCardSkeleton";
import { formatINR, cn } from "@/lib/format";
import { prodMrp, prodRating } from "@/lib/api/helpers";
import { useStoreSettings } from "@/hooks/use-store-settings";

type Search = { category?: string; brand?: string; sort?: "new" | "sale" | "priceAsc" | "priceDesc" | "rating"; page?: number; min?: number; max?: number; rating?: number };

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    category: s.category as string | undefined,
    brand: s.brand as string | undefined,
    sort: s.sort as Search["sort"],
    page: s.page ? Number(s.page) : 1,
    min: s.min ? Number(s.min) : undefined,
    max: s.max ? Number(s.max) : undefined,
    rating: s.rating ? Number(s.rating) : undefined,
  }),
  head: () => ({ meta: [
    { title: "Shop all — SK" },
    { name: "description", content: "Browse the full SK catalogue: sneakers, apparel, audio, watches and more." },
  ]}),
  component: ShopPage,
});

const PER_PAGE = 8;

function ShopPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const settings = useStoreSettings();
  const { data: all = [], isLoading: loading } = useQuery({
    queryKey: ["products"],
    queryFn: listProducts,
    staleTime: 0,
    refetchOnMount: "always",
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.list,
    staleTime: 0,
    refetchOnMount: "always",
  });
  const brands = useMemo(
    () => Array.from(new Set(all.map((p) => p.brand).filter(Boolean))).sort(),
    [all],
  );
  const [open, setOpen] = useState(false);
  const [priceMax, setPriceMax] = useState(search.max ?? 200000);

  const filtered = useMemo(() => {
    let list = [...all];
    if (search.category) list = list.filter((p) => p.category === search.category);
    if (search.brand) list = list.filter((p) => p.brand === search.brand);
    if (search.min != null) list = list.filter((p) => p.price >= (search.min ?? 0));
    if (search.max != null) list = list.filter((p) => p.price <= (search.max ?? Infinity));
    if (search.rating) list = list.filter((p) => prodRating(p) >= (search.rating ?? 0));
    switch (search.sort) {
      case "priceAsc": list.sort((a, b) => a.price - b.price); break;
      case "priceDesc": list.sort((a, b) => b.price - a.price); break;
      case "rating": list.sort((a, b) => prodRating(b) - prodRating(a)); break;
      case "new": list = list.filter((p) => p.isNew).concat(list.filter((p) => !p.isNew)); break;
      case "sale": list.sort((a, b) => (prodMrp(b) - b.price) / prodMrp(b) - (prodMrp(a) - a.price) / prodMrp(a)); break;
    }
    return list;
  }, [all, search]);

  const page = search.page ?? 1;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const updateSearch = (next: Partial<Search>) =>
    navigate({ search: (prev: any) => ({ ...prev, ...next, page: 1 }) as Search });

  const activeChips: { label: string; clear: () => void }[] = [];
  if (search.category) activeChips.push({ label: categories.find((c: Category) => c.slug === search.category)?.name ?? search.category, clear: () => updateSearch({ category: undefined }) });
  if (search.brand) activeChips.push({ label: search.brand, clear: () => updateSearch({ brand: undefined }) });
  if (search.rating) activeChips.push({ label: `${search.rating}★ & up`, clear: () => updateSearch({ rating: undefined }) });
  if (search.min != null || search.max != null) activeChips.push({ label: `${formatINR(search.min ?? 0)}–${formatINR(search.max ?? 200000)}`, clear: () => updateSearch({ min: undefined, max: undefined }) });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {settings.bannerUrl && (
        <div className="relative mb-6 overflow-hidden rounded-3xl shadow-card">
          <img src={settings.bannerUrl} alt={settings.storeName} className="h-40 w-full object-cover sm:h-56" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-5 text-white sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-widest opacity-90">{settings.storeName}</p>
            <h2 className="mt-1 text-2xl font-black sm:text-3xl">Shop the collection</h2>
          </div>
        </div>
      )}
      <Breadcrumbs items={[["Home","/"],["Shop","/shop"], ...(search.category ? [[categories.find((c: Category) => c.slug === search.category)?.name ?? "", "/shop"] as [string, string]] : [])]} />
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{search.category ? categories.find((c: Category) => c.slug === search.category)?.name ?? search.category : "Shop all"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{filtered.length} products</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-semibold lg:hidden">
            <SlidersHorizontal className="h-4 w-4" />Filters
          </button>
          <SortMenu value={search.sort} onChange={(sort) => updateSearch({ sort })} />
        </div>
      </div>

      {activeChips.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {activeChips.map((c, i) => (
            <button key={i} onClick={c.clear} className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              {c.label} <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <Filters search={search} update={updateSearch} priceMax={priceMax} setPriceMax={setPriceMax} categories={categories} brands={brands} />
        </aside>

        <div>
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}</div>
          ) : paged.length === 0 ? (
            <div className="rounded-3xl border bg-card p-12 text-center">
              <p className="text-lg font-semibold">No products match these filters</p>
              <p className="mt-1 text-sm text-muted-foreground">Try clearing some filters.</p>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
              <AnimatePresence>{paged.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}</AnimatePresence>
            </motion.div>
          )}

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} onClick={() => navigate({ search: (p: any) => ({ ...p, page: i + 1 }) })} className={cn("h-9 min-w-9 rounded-full px-3 text-sm font-semibold transition", page === i + 1 ? "bg-foreground text-background" : "border bg-background hover:bg-secondary")}>{i + 1}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 280, damping: 32 }} className="fixed left-0 top-0 z-50 h-full w-[85%] max-w-sm overflow-y-auto bg-background p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold">Filters</h2>
                <button onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"><X className="h-4 w-4" /></button>
              </div>
              <Filters search={search} update={updateSearch} priceMax={priceMax} setPriceMax={setPriceMax} categories={categories} brands={brands} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function Filters({ search, update, priceMax, setPriceMax, categories, brands }: { search: Search; update: (s: Partial<Search>) => void; priceMax: number; setPriceMax: (n: number) => void; categories: Category[]; brands: string[] }) {
  return (
    <div className="space-y-6 rounded-3xl border bg-card p-5 shadow-card">
      <Group title="Category">
        <div className="space-y-1.5">
          {categories.length === 0 && <p className="text-xs text-muted-foreground">No categories</p>}
          {categories.map((c: Category) => (
            <label key={c.slug} className="flex cursor-pointer items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <input type="radio" name="cat" checked={search.category === c.slug} onChange={() => update({ category: c.slug })} className="accent-indigo" />
                {c.name}
              </span>
            </label>
          ))}
          {search.category && <button onClick={() => update({ category: undefined })} className="text-xs font-semibold text-indigo">Clear</button>}
        </div>
      </Group>
      <Group title="Brand">
        <div className="grid grid-cols-2 gap-1.5">
          {brands.length === 0 && <p className="text-xs text-muted-foreground">No brands yet</p>}
          {brands.map((b: string) => (
            <label key={b} className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="radio" name="brand" checked={search.brand === b} onChange={() => update({ brand: b })} className="accent-indigo" />
              {b}
            </label>
          ))}
          {search.brand && <button onClick={() => update({ brand: undefined })} className="text-xs font-semibold text-indigo">Clear</button>}
        </div>
      </Group>
      <Group title="Price">
        <input type="range" min={0} max={200000} step={500} value={priceMax} onChange={(e) => setPriceMax(Number(e.target.value))} onMouseUp={(e) => update({ max: Number((e.target as HTMLInputElement).value) })} onTouchEnd={(e) => update({ max: Number((e.target as HTMLInputElement).value) })} className="w-full accent-indigo" />
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>{formatINR(0)}</span><span>{formatINR(priceMax)}</span>
        </div>
      </Group>
      <Group title="Rating">
        <div className="space-y-1.5">
          {[4, 3, 2].map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="radio" name="rating" checked={search.rating === r} onChange={() => update({ rating: r })} className="accent-indigo" />
              <span className="text-orange">{"★".repeat(r)}</span><span className="text-muted-foreground">& up</span>
            </label>
          ))}
        </div>
      </Group>
      <Group title="Availability">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" className="accent-indigo" defaultChecked /> In stock only
        </label>
      </Group>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

function SortMenu({ value, onChange }: { value?: Search["sort"]; onChange: (v: Search["sort"]) => void }) {
  const [open, setOpen] = useState(false);
  const opts: { v: Search["sort"]; label: string }[] = [
    { v: undefined, label: "Featured" },
    { v: "new", label: "Newest" },
    { v: "sale", label: "Biggest discount" },
    { v: "priceAsc", label: "Price: low → high" },
    { v: "priceDesc", label: "Price: high → low" },
    { v: "rating", label: "Top rated" },
  ];
  const current = opts.find((o) => o.v === value)?.label ?? "Featured";
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-semibold">
        Sort: {current} <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-2xl border bg-popover shadow-soft">
            {opts.map((o) => (
              <li key={o.label}><button onClick={() => { onChange(o.v); setOpen(false); }} className={cn("block w-full px-4 py-2.5 text-left text-sm hover:bg-secondary", value === o.v && "font-bold text-indigo")}>{o.label}</button></li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function Breadcrumbs({ items }: { items: [string, string][] }) {
  return (
    <nav className="text-xs text-muted-foreground">
      {items.map(([label, to], i) => (
        <span key={i}>
          {i > 0 && <span className="mx-1.5 opacity-50">/</span>}
          {i === items.length - 1 ? <span className="font-semibold text-foreground">{label}</span> : <Link to={to as any} className="hover:text-foreground">{label}</Link>}
        </span>
      ))}
    </nav>
  );
}
