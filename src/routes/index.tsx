import { SmartImage } from "@/components/ui/SmartImage";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Shield, Sparkles, Truck, RefreshCcw, Star, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listProducts } from "@/lib/api/products";
import { categoriesApi, type Category } from "@/lib/api/categories";
import type { Product } from "@/lib/api/mock-data";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductCardSkeleton } from "@/components/product/ProductCardSkeleton";
import { formatINR } from "@/lib/format";
import { productImage } from "@/lib/api/helpers";
import { useStoreSettings } from "@/hooks/use-store-settings";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SK — Premium shopping, beautifully delivered" },
      {
        name: "description",
        content:
          "Curated sneakers, apparel, audio, watches and more. Free shipping over ₹1,499 with easy 30-day returns.",
      },
      { property: "og:title", content: "SK — Premium shopping" },
      {
        property: "og:description",
        content: "A modern marketplace for the things you actually want.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: products = [], isLoading: loading } = useQuery({
    queryKey: ["products"],
    queryFn: listProducts,
    staleTime: 0,
    refetchOnMount: "always",
  });
  const brands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand).filter(Boolean))).slice(0, 10),
    [products],
  );

  const tagged = (key: string) => products.filter((p) => (p.tags ?? []).includes(key));
  const trending = (tagged("trending").length ? tagged("trending") : products).slice(0, 8);
  const newArrivals = (
    products.filter((p) => p.isNew).length ? products.filter((p) => p.isNew) : products
  ).slice(0, 4);
  const bestsellers = (
    products.filter((p) => p.isBestseller).length
      ? products.filter((p) => p.isBestseller)
      : products
  ).slice(0, 4);
  const flash = (
    products.filter((p) => p.flashDeal).length ? products.filter((p) => p.flashDeal) : products
  ).slice(0, 4);
  const featured = products[3] ?? products[0];

  return (
    <>
      <Hero featured={featured} />
      <PromoBanner />
      <Categories />
      <Section title="Trending now" sub="What everyone is reaching for this week" link="/shop">
        <Grid loading={loading}>
          {trending.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </Grid>
      </Section>
      <FeaturedCollection />
      <Section title="New arrivals" sub="Fresh drops from the brands you love" link="/shop">
        <Grid loading={loading}>
          {newArrivals.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </Grid>
      </Section>
      <FlashDeals products={flash} loading={loading} />
      <Section title="Best sellers" sub="Tried, tested and adored" link="/shop">
        <Grid loading={loading}>
          {bestsellers.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </Grid>
      </Section>
      <Reviews />
      <BrandStrip brands={brands} />
      <Newsletter />
    </>
  );
}

function Hero({ featured }: { featured?: Product }) {
  const { bannerUrl, storeName } = useStoreSettings();
  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      {bannerUrl ? (
        <>
          <img
            src={bannerUrl}
            alt={storeName}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/40" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-mesh opacity-80" />
      )}
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:py-24 lg:grid-cols-2">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-semibold text-foreground/80 shadow-soft"
          >
            <Sparkles className="h-3.5 w-3.5 text-orange" /> New season · Summer collection
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="mt-5 text-balance text-5xl font-black leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl"
          >
            Shop the{" "}
            <span
              style={{
                backgroundImage: "var(--gradient-primary)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              finer
            </span>
            <br />
            everyday.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-5 max-w-md text-base text-muted-foreground"
          >
            A curated marketplace of sneakers, apparel, audio and accessories from the brands that
            shape culture. Hand-picked, beautifully delivered.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-7 flex flex-wrap gap-3"
          >
            <Link
              to="/shop"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-cta px-6 py-3 text-sm font-bold text-white shadow-glow transition hover:-translate-y-0.5"
            >
              Shop the drop{" "}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/shop"
              search={{ sort: "new" } as any}
              className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-6 py-3 text-sm font-semibold backdrop-blur transition hover:bg-background"
            >
              New arrivals
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 grid max-w-md grid-cols-3 gap-3 text-xs"
          >
            {[
              [Truck, "Free shipping"],
              [Shield, "Secure pay"],
              [RefreshCcw, "30-day returns"],
            ].map(([Icon, label], i) => (
              <div key={i} className="flex items-center gap-2 rounded-2xl glass px-3 py-2.5">
                {/* @ts-expect-error */}
                <Icon className="h-4 w-4 text-indigo" />
                <span className="font-semibold">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>
        {featured && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-primary opacity-20 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2.5rem] bg-card shadow-glow">
              <SmartImage
                src={productImage(featured)}
                alt={featured.name}
                eager
                wrapperClassName="aspect-[4/5] w-full"
              />
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl glass p-3 shadow-soft"
              >
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {featured.brand}
                  </p>
                  <p className="text-sm font-bold">{featured.name}</p>
                </div>
                <Link
                  to="/product/$id"
                  params={{ id: featured.id }}
                  className="rounded-full bg-foreground px-4 py-2 text-xs font-bold text-background"
                >
                  {formatINR(featured.price)}
                </Link>
              </motion.div>
            </div>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-4 top-6 hidden rounded-2xl bg-card p-3 shadow-soft sm:flex sm:items-center sm:gap-2"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald/15 text-emerald">
                <Star className="h-4 w-4 fill-emerald" />
              </span>
              <div>
                <p className="text-xs font-bold">4.9 / 5</p>
                <p className="text-[10px] text-muted-foreground">12k reviews</p>
              </div>
            </motion.div>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-4 bottom-24 hidden rounded-2xl bg-card p-3 shadow-soft sm:flex sm:items-center sm:gap-2"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange/15 text-orange">
                <Zap className="h-4 w-4 fill-orange" />
              </span>
              <div>
                <p className="text-xs font-bold">Free 2-day</p>
                <p className="text-[10px] text-muted-foreground">on orders ₹1,499+</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  );
}

function PromoBanner() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="relative overflow-hidden bg-foreground py-3 text-background"
    >
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="flex shrink-0 gap-12 whitespace-nowrap text-sm font-semibold uppercase tracking-widest"
      >
        {Array.from({ length: 2 }).flatMap((_, k) =>
          [
            "Summer Sale up to 60% off",
            "Free shipping ₹1,499+",
            "WELCOME10 — 10% off your first order",
            "30-day easy returns",
            "New drops every Friday",
          ].map((t, i) => (
            <span key={`${k}-${i}`} className="flex items-center gap-12">
              <span>{t}</span>
              <span className="text-orange">★</span>
            </span>
          )),
        )}
      </motion.div>
    </motion.div>
  );
}

function Categories() {
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.list,
    staleTime: 0,
    refetchOnMount: "always",
  });
  const palette = [
    "from-indigo/15 to-indigo/5",
    "from-emerald/20 to-emerald/5",
    "from-orange/20 to-orange/5",
    "from-royal/15 to-royal/5",
    "from-indigo/10 to-emerald/10",
    "from-orange/15 to-indigo/10",
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <SectionHeader title="Shop by category" sub="Find your aesthetic" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {categories.map((c: Category, i: number) => (
          <motion.div
            key={c.slug}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          >
            <Link
              to="/shop"
              search={{ category: c.slug } as never}
              className={`group block aspect-square overflow-hidden rounded-3xl bg-gradient-to-br ${palette[i % palette.length]} p-5 transition hover:-translate-y-1 shadow-card hover:shadow-soft`}
            >
              <div className="flex h-full flex-col justify-between">
                <div className="h-12 w-12 rounded-2xl bg-background/60 backdrop-blur flex items-center justify-center text-xl">
                  {["👟", "👕", "⌚", "🎧", "🎒", "👓"][i]}
                </div>
                <div>
                  <p className="text-sm font-bold">{c.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{c.slug}</p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function SectionHeader({ title, sub, link }: { title: string; sub?: string; link?: string }) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4">
      <div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-black tracking-tight sm:text-4xl"
        >
          {title}
        </motion.h2>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {link && (
        <Link
          to={link}
          className="inline-flex items-center gap-1 text-sm font-semibold text-foreground/80 hover:text-foreground"
        >
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function Section({
  title,
  sub,
  link,
  children,
}: {
  title: string;
  sub?: string;
  link?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <SectionHeader title={title} sub={sub} link={link} />
      {children}
    </section>
  );
}

function Grid({ children, loading }: { children: React.ReactNode; loading?: boolean }) {
  if (loading)
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  return <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{children}</div>;
}

function FeaturedCollection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative col-span-2 overflow-hidden rounded-3xl bg-gradient-primary p-8 text-white shadow-glow sm:p-12"
        >
          <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <p className="text-xs uppercase tracking-widest opacity-80">Featured collection</p>
          <h3 className="mt-3 max-w-md text-3xl font-black leading-tight sm:text-5xl">
            Quiet luxury, loud confidence.
          </h3>
          <p className="mt-3 max-w-md text-sm opacity-90">
            Tailored essentials and statement pieces from the season's most-watched houses.
          </p>
          <Link
            to="/shop"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-neutral-900"
          >
            Explore <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-cta p-8 text-white shadow-glow"
        >
          <p className="text-xs uppercase tracking-widest opacity-90">Limited drop</p>
          <h3 className="mt-3 text-3xl font-black leading-tight">Up to 60% off select sneakers</h3>
          <p className="mt-2 text-sm opacity-90">Ends Sunday.</p>
          <Link
            to="/shop"
            search={{ category: "sneakers" } as never}
            className="mt-5 inline-flex rounded-full bg-foreground px-5 py-2.5 text-sm font-bold text-background"
          >
            Shop sale
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function FlashDeals({ products, loading }: { products: Product[]; loading?: boolean }) {
  const [t, setT] = useState({ h: 11, m: 24, s: 53 });
  useEffect(() => {
    const id = setInterval(
      () =>
        setT(({ h, m, s }) => {
          if (s > 0) return { h, m, s: s - 1 };
          if (m > 0) return { h, m: m - 1, s: 59 };
          if (h > 0) return { h: h - 1, m: 59, s: 59 };
          return { h: 0, m: 0, s: 0 };
        }),
      1000,
    );
    return () => clearInterval(id);
  }, []);
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="rounded-3xl bg-neutral-900 p-6 text-white sm:p-10 dark:bg-neutral-950 dark:ring-1 dark:ring-white/10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-orange/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange">
              <Zap className="h-3 w-3" /> Flash deals
            </p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">Hot prices, only today.</h2>
          </div>
          <div className="flex items-center gap-2 text-sm font-bold">
            {(["h", "m", "s"] as const).map((k) => (
              <div
                key={k}
                className="grid h-12 w-14 place-items-center rounded-xl bg-white/10 text-lg tabular-nums"
              >
                {String(t[k]).padStart(2, "0")}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {(loading ? Array.from({ length: 4 }) : products).map((p: any, i: number) =>
            loading ? (
              <div key={i} className="aspect-[4/5] rounded-2xl bg-white/10 animate-pulse" />
            ) : (
              <div key={p.id} className="text-foreground">
                <ProductCard product={p} index={i} />
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

function Reviews() {
  const items = [
    {
      n: "Anaya R.",
      t: "I get compliments every time I wear the Court Vintage. Shipping was insanely fast.",
      r: 5,
    },
    {
      n: "Devansh K.",
      t: "Best online shopping experience. Genuine products, premium packaging.",
      r: 5,
    },
    {
      n: "Meera P.",
      t: "Returned an item easily — full refund in 2 days. They've earned a customer.",
      r: 5,
    },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <SectionHeader title="Loved by 50,000+ shoppers" sub="Real words from real people" />
      <div className="grid gap-4 sm:grid-cols-3">
        {items.map((r, i) => (
          <motion.figure
            key={i}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="rounded-3xl bg-card p-6 shadow-card"
          >
            <div className="flex text-orange">
              {Array.from({ length: r.r }).map((_, k) => (
                <Star key={k} className="h-4 w-4 fill-orange" />
              ))}
            </div>
            <blockquote className="mt-3 text-sm leading-relaxed text-foreground/90">
              "{r.t}"
            </blockquote>
            <figcaption className="mt-4 text-xs font-semibold text-muted-foreground">
              — {r.n}
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}

function BrandStrip({ brands }: { brands: string[] }) {
  if (brands.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <p className="mb-6 text-center text-xs uppercase tracking-widest text-muted-foreground">
        Trusted by the world's best brands
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
        {brands.map((b: string, i: number) => (
          <motion.span
            key={b}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.7 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04 }}
            className="text-lg font-black uppercase tracking-wider text-foreground/60 transition hover:opacity-100 hover:text-foreground"
          >
            {b}
          </motion.span>
        ))}
      </div>
    </section>
  );
}

function Newsletter() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-primary p-8 text-white shadow-glow sm:p-14">
        <div className="absolute -right-10 -top-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="relative grid items-center gap-6 sm:grid-cols-2">
          <div>
            <h2 className="text-3xl font-black sm:text-4xl">Get 10% off your first order.</h2>
            <p className="mt-2 max-w-md text-sm opacity-90">
              Join the SK list for exclusive drops, restocks and members-only sales.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
            className="flex w-full max-w-md flex-col gap-2 sm:flex-row"
          >
            <input
              required
              type="email"
              placeholder="you@example.com"
              className="flex-1 rounded-full bg-white/15 px-5 py-3 text-sm text-white placeholder:text-white/70 outline-none ring-1 ring-white/20 focus:ring-white/50 backdrop-blur"
            />
            <button className="rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background transition hover:scale-[1.02]">
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
