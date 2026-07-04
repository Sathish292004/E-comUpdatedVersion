import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { categoriesApi, type Category } from "@/lib/api/categories";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Shop by category — SK" },
      { name: "description", content: "Browse every SK category — sneakers, apparel, audio, watches, bags and accessories." },
      { property: "og:title", content: "Shop by category — SK" },
      { property: "og:url", content: "/categories" },
    ],
    links: [{ rel: "canonical", href: "/categories" }],
  }),
  component: CategoriesPage,
});

const emoji = ["👟", "👕", "⌚", "🎧", "🎒", "👓"];
const palette = [
  "from-indigo/15 to-indigo/5",
  "from-emerald/20 to-emerald/5",
  "from-orange/20 to-orange/5",
  "from-royal/15 to-royal/5",
  "from-indigo/10 to-emerald/10",
  "from-orange/15 to-indigo/10",
];

function CategoriesPage() {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.list,
    staleTime: 0,
    refetchOnMount: "always",
  });
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
      <header className="mb-10 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Catalogue</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">Shop by category</h1>
        <p className="mt-3 text-muted-foreground">
          Find what you love by browsing every department. Hand-picked products from the
          world's most-watched brands, delivered beautifully.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading categories…</p>
        )}
        {!isLoading && categories.length === 0 && (
          <p className="text-sm text-muted-foreground">No categories yet.</p>
        )}
        {categories.map((c: Category, i: number) => (
          <motion.div
            key={c.slug}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          >
            <Link
              to="/shop"
              search={{ category: c.slug } as never}
              className={`group relative block overflow-hidden rounded-3xl bg-gradient-to-br ${palette[i % palette.length]} p-6 shadow-card transition hover:-translate-y-1 hover:shadow-soft`}
              aria-label={`Browse ${c.name}`}
            >
              <div className="flex items-start justify-between">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-background/60 text-2xl backdrop-blur">
                  {emoji[i % emoji.length]}
                </div>
              </div>
              <div className="mt-10 flex items-end justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight">{c.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Shop the {c.name.toLowerCase()} edit</p>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-foreground text-background transition group-hover:translate-x-1">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </main>
  );
}