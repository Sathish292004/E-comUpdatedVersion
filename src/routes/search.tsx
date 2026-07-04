import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Search as SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchProducts } from "@/lib/api/products";
import type { Product } from "@/lib/api/mock-data";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductCardSkeleton } from "@/components/product/ProductCardSkeleton";

type SearchParams = { q?: string };

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Search — SK" },
      { name: "description", content: "Search the SK catalogue for products, brands and categories." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q = "" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [input, setInput] = useState(q);
  useEffect(() => { setInput(q); }, [q]);
  const trimmed = q.trim();
  const { data: results = [], isFetching: loading } = useQuery({
    queryKey: ["products", "search", trimmed],
    queryFn: () => searchProducts(trimmed),
    enabled: !!trimmed,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ search: { q: input.trim() || undefined } });
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Search</h1>
        <form onSubmit={submit} className="mt-5 flex items-center gap-2 rounded-2xl border bg-card px-4 py-3 shadow-soft">
          <SearchIcon className="h-5 w-5 text-muted-foreground" />
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search for products, brands, categories…"
            className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
            aria-label="Search SK"
          />
          <button
            type="submit"
            className="rounded-full bg-foreground px-5 py-2 text-sm font-bold text-background transition hover:scale-[1.02]"
          >
            Search
          </button>
        </form>
        {q && (
          <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
            {loading ? "Searching…" : `${results.length} ${results.length === 1 ? "result" : "results"} for `}
            {!loading && <span className="font-semibold text-foreground">"{q}"</span>}
          </p>
        )}
      </header>

      {!q.trim() ? (
        <EmptyHint />
      ) : loading ? (
        <Grid>{Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}</Grid>
      ) : results.length === 0 ? (
        <NoResults q={q} />
      ) : (
        <Grid>
          {results.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i, 8) * 0.04 }}
            >
              <ProductCardWithHighlight product={p} query={q} index={i} />
            </motion.div>
          ))}
        </Grid>
      )}
    </main>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{children}</div>;
}

function EmptyHint() {
  const suggestions = ["Running shoes", "Wireless earbuds", "Smartwatch", "Slim fit jeans", "Aviators"];
  return (
    <div className="rounded-3xl border bg-card p-10 text-center shadow-card">
      <SearchIcon className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden />
      <p className="mt-4 text-lg font-semibold">Start typing to search</p>
      <p className="mt-1 text-sm text-muted-foreground">Try one of the suggestions below.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {suggestions.map((s) => (
          <Link
            key={s}
            to="/search"
            search={{ q: s }}
            className="rounded-full border bg-background px-4 py-2 text-sm font-semibold transition hover:bg-secondary"
          >
            {s}
          </Link>
        ))}
      </div>
    </div>
  );
}

function NoResults({ q }: { q: string }) {
  return (
    <div className="rounded-3xl border bg-card p-10 text-center shadow-card">
      <p className="text-lg font-semibold">No results for "{q}"</p>
      <p className="mt-1 text-sm text-muted-foreground">Try a different keyword or browse the catalogue.</p>
      <div className="mt-6">
        <Link
          to="/shop"
          className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-bold text-background"
        >
          Browse all products
        </Link>
      </div>
    </div>
  );
}

function ProductCardWithHighlight({ product, query, index }: { product: Product; query: string; index: number }) {
  // Visual highlight on the name; ProductCard already handles layout.
  // We render the standard card; a true highlight could be added inside ProductCard,
  // but we keep the card consistent and use aria-live above for context.
  void query;
  return <ProductCard product={product} index={index} />;
}