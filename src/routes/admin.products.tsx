import { SmartImage } from "@/components/ui/SmartImage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Edit2, Trash2, Search, X, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listProducts, deleteProduct, createProduct, updateProduct, type Product, type ProductInput } from "@/lib/api/products";
import { categoriesApi } from "@/lib/api/categories";
import { productImage, prodStock } from "@/lib/api/helpers";
import {
  loadProductGallery,
  saveProductGallery,
  loadProductListing,
  saveProductListing,
  loadProductHashes,
  saveProductHashes,
  loadProductGalleryWebp,
  saveProductGalleryWebp,
  loadProductGalleryAvif,
  saveProductGalleryAvif,
  loadProductListingWebp,
  saveProductListingWebp,
  loadProductListingAvif,
  saveProductListingAvif,
} from "@/lib/admin-settings";
import { processProductImage, dataUrlToFile, type ProcessedImage } from "@/lib/image-utils";
import { formatINR, cn } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/products")({ component: Products });

function Products() {
  const queryClient = useQueryClient();
  const { data: items = [], isLoading: loading } = useQuery({
    queryKey: ["products"],
    queryFn: listProducts,
    staleTime: 0,
    refetchOnMount: "always",
  });
  const invalidateProducts = () => queryClient.invalidateQueries({ queryKey: ["products"] });
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("all");
  const [availability, setAvailability] = useState<"all" | "in" | "out" | "low">("all");
  const [sort, setSort] = useState<"name" | "priceAsc" | "priceDesc" | "stock">("name");

  const categories = Array.from(new Set(items.map((p) => p.category).filter(Boolean)));
  const filtered = items
    .filter((p) => `${p.name} ${p.brand}`.toLowerCase().includes(q.toLowerCase()))
    .filter((p) => category === "all" || p.category === category)
    .filter((p) => {
      const st = prodStock(p);
      if (availability === "in") return st > 0;
      if (availability === "out") return st === 0;
      if (availability === "low") return st > 0 && st <= 10;
      return true;
    })
    .sort((a, b) => {
      if (sort === "priceAsc") return a.price - b.price;
      if (sort === "priceDesc") return b.price - a.price;
      if (sort === "stock") return prodStock(a) - prodStock(b);
      return a.name.localeCompare(b.name);
    });
  const onDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try { await deleteProduct(id); await invalidateProducts(); toast.success("Deleted"); }
    catch (e: any) { toast.error(e?.message ?? "Delete failed"); }
  };
  const openCreate = () => { setEditing(null); setOpen(true); };
  const openEdit = (p: Product) => { setEditing(p); setOpen(true); };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Products</h1>
          <p className="text-sm text-muted-foreground">{loading ? "Loading…" : `${filtered.length} items in catalogue`}</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-full bg-gradient-cta px-5 py-2.5 text-sm font-bold text-white shadow-glow"><Plus className="h-4 w-4" />Add product</button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="w-full rounded-full border bg-background px-9 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo/20" />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-full border bg-background px-4 py-2.5 text-sm font-semibold outline-none">
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>
        <select value={availability} onChange={(e) => setAvailability(e.target.value as any)} className="rounded-full border bg-background px-4 py-2.5 text-sm font-semibold outline-none">
          <option value="all">All stock</option>
          <option value="in">In stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="rounded-full border bg-background px-4 py-2.5 text-sm font-semibold outline-none">
          <option value="name">Sort: name</option>
          <option value="priceAsc">Price ↑</option>
          <option value="priceDesc">Price ↓</option>
          <option value="stock">Stock</option>
        </select>
      </div>
      <motion.div layout className="overflow-hidden rounded-3xl border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-secondary/40 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="px-4 py-3">Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th className="text-right pr-4">Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map((p) => { const st = prodStock(p); return (
              <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t hover:bg-secondary/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <SmartImage src={productImage(p)} alt={p.name} wrapperClassName="h-10 w-10 rounded-lg" />
                    <div><p className="line-clamp-1 font-bold">{p.name}</p><p className="text-xs text-muted-foreground">{p.brand}</p></div>
                  </div>
                </td>
                <td className="capitalize">{p.category}</td>
                <td className="font-semibold">{formatINR(p.price)}</td>
                <td><span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", st > 10 ? "bg-emerald/15 text-emerald" : st > 0 ? "bg-orange/15 text-orange" : "bg-destructive/15 text-destructive")}>{st} left</span></td>
                <td><span className="rounded-full bg-indigo/15 px-2 py-0.5 text-xs font-bold text-indigo">Live</span></td>
                <td className="pr-4">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openEdit(p)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-secondary"><Edit2 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => onDelete(p.id)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </motion.tr>
            ); })}
          </tbody>
        </table>
      </motion.div>

      <AnimatePresence>
        {open && (
          <ProductForm
            initial={editing}
            onClose={() => setOpen(false)}
            onSaved={() => { setOpen(false); invalidateProducts(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductForm({ initial, onClose, onSaved }: { initial: Product | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<ProductInput>({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    brand: initial?.brand ?? "",
    price: initial?.price ?? 0,
    category: initial?.category ?? "",
    releaseDate: initial?.releaseDate ?? new Date().toISOString().slice(0, 10),
    productAvailable: initial?.productAvailable ?? true,
    stockQuantity: initial?.stockQuantity ?? 0,
  });
  // Gallery entries carry both the 1:1 (full) and 4:5 (listing) crops in
  // up to three formats (JPEG / WebP / AVIF) plus a content hash for
  // duplicate detection. `dirty` marks freshly-cropped entries that still
  // need to be re-uploaded to the backend on save.
  type GalleryItem = {
    full: string;        // JPEG dataURL — sent to backend, used as <img src>
    fullWebp?: string;
    fullAvif?: string;
    listing: string;     // JPEG dataURL
    listingWebp?: string;
    listingAvif?: string;
    hash: string;
    dirty: boolean;
  };
  const initialGallery: GalleryItem[] = (() => {
    if (!initial) return [];
    const full = loadProductGallery(initial.id);
    const listing = loadProductListing(initial.id);
    const hashes = loadProductHashes(initial.id);
    const fw = loadProductGalleryWebp(initial.id);
    const fa = loadProductGalleryAvif(initial.id);
    const lw = loadProductListingWebp(initial.id);
    const la = loadProductListingAvif(initial.id);
    if (full.length) {
      return full.map((f, i) => ({
        full: f,
        fullWebp: fw[i] || undefined,
        fullAvif: fa[i] || undefined,
        listing: listing[i] ?? f,
        listingWebp: lw[i] || undefined,
        listingAvif: la[i] || undefined,
        hash: hashes[i] ?? "",
        dirty: false,
      }));
    }
    const base = initial.images?.[0];
    return base ? [{ full: base, listing: base, hash: "", dirty: false }] : [];
  })();
  const [gallery, setGallery] = useState<GalleryItem[]>(initialGallery);
  const [processing, setProcessing] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const addImages = async (list: FileList | null) => {
    if (!list || !list.length) return;
    setProcessing(true);
    let added = 0;
    let duplicates = 0;
    try {
      const results: ProcessedImage[] = [];
      for (const file of Array.from(list)) {
        if (!file.type.startsWith("image/")) continue;
        try { results.push(await processProductImage(file)); }
        catch { toast.error(`Could not read ${file.name}`); }
      }
      setGallery((g) => {
        const seen = new Set(g.map((x) => x.hash).filter(Boolean));
        const next = [...g];
        for (const r of results) {
          if (seen.has(r.hash)) { duplicates++; continue; }
          seen.add(r.hash);
          next.push({
            full: r.full.jpeg,
            fullWebp: r.full.webp,
            fullAvif: r.full.avif,
            listing: r.listing.jpeg,
            listingWebp: r.listing.webp,
            listingAvif: r.listing.avif,
            hash: r.hash,
            dirty: true,
          });
          added++;
        }
        return next;
      });
      if (added) {
        const fmts = ["JPEG"];
        if (results.some((r) => r.full.webp)) fmts.push("WebP");
        if (results.some((r) => r.full.avif)) fmts.push("AVIF");
        toast.success(`${added} image${added > 1 ? "s" : ""} cropped (1:1 + 4:5) · ${fmts.join(" / ")}`);
      }
      if (duplicates) toast.warning(`${duplicates} duplicate${duplicates > 1 ? "s" : ""} skipped`);
    } finally {
      setProcessing(false);
    }
  };
  const removeImage = (i: number) => {
    setGallery((g) => g.filter((_, k) => k !== i));
    setActiveIdx((a) => (a >= i && a > 0 ? a - 1 : a));
  };
  const moveImage = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= gallery.length) return;
    setGallery((g) => { const n = [...g]; [n[i], n[j]] = [n[j], n[i]]; return n; });
    setActiveIdx((a) => (a === i ? j : a === j ? i : a));
  };
  const promoteToMain = (i: number) => {
    if (i === 0) return;
    setGallery((g) => { const n = [...g]; const [it] = n.splice(i, 1); n.unshift(it); return n; });
    setActiveIdx(0);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Backend stores a single image — send the (cropped) main slot when it
      // is dirty, or when the first item is freshly cropped on create.
      const main = gallery[0];
      const primary = main?.dirty ? dataUrlToFile(main.full, `${(form.name || "product").replace(/\W+/g, "-").toLowerCase()}.jpg`) : undefined;
      let savedId = initial?.id;
      if (initial) {
        await updateProduct(initial.id, form, primary);
        toast.success("Product updated");
      } else {
        const created = await createProduct(form, primary);
        savedId = created?.id;
        toast.success("Product created");
      }
      if (savedId) {
        saveProductGallery(savedId, gallery.map((g) => g.full));
        saveProductListing(savedId, gallery.map((g) => g.listing));
        saveProductHashes(savedId, gallery.map((g) => g.hash));
        saveProductGalleryWebp(savedId, gallery.map((g) => g.fullWebp ?? ""));
        saveProductGalleryAvif(savedId, gallery.map((g) => g.fullAvif ?? ""));
        saveProductListingWebp(savedId, gallery.map((g) => g.listingWebp ?? ""));
        saveProductListingAvif(savedId, gallery.map((g) => g.listingAvif ?? ""));
      }
      onSaved();
    } catch (err: any) {
      toast.error(err?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.form
        onSubmit={submit}
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border bg-card p-6 shadow-card"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-black">{initial ? "Edit product" : "Add product"}</h2>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" full>
            <input required value={form.name} onChange={(e) => set("name", e.target.value)} className="ipt" />
          </Field>
          <Field label="Brand">
            <input value={form.brand ?? ""} onChange={(e) => set("brand", e.target.value)} className="ipt" />
          </Field>
          <Field label="Category">
            <CategorySelect value={form.category ?? ""} onChange={(v) => set("category", v)} />
          </Field>
          <Field label="Price (₹)">
            <input type="number" min={0} step="0.01" required value={form.price} onChange={(e) => set("price", Number(e.target.value))} className="ipt" />
          </Field>
          <Field label="Stock quantity">
            <input type="number" min={0} value={form.stockQuantity ?? 0} onChange={(e) => set("stockQuantity", Number(e.target.value))} className="ipt" />
          </Field>
          <Field label="Release date">
            <input type="date" value={(form.releaseDate ?? "").slice(0, 10)} onChange={(e) => set("releaseDate", e.target.value)} className="ipt" />
          </Field>
          <Field label="Available">
            <select value={form.productAvailable ? "y" : "n"} onChange={(e) => set("productAvailable", e.target.value === "y")} className="ipt">
              <option value="y">In stock</option>
              <option value="n">Out of stock</option>
            </select>
          </Field>
          <Field label="Description" full>
            <textarea rows={3} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} className="ipt" />
          </Field>
          <Field label={`Product images (${gallery.length})`} full>
            <GalleryEditor
              gallery={gallery}
              activeIdx={activeIdx}
              setActiveIdx={setActiveIdx}
              processing={processing}
              addImages={addImages}
              moveImage={moveImage}
              promoteToMain={promoteToMain}
              removeImage={removeImage}
              productName={form.name || "Product name"}
              price={form.price}
            />
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full border bg-background px-5 py-2.5 text-sm font-semibold hover:bg-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-full bg-gradient-cta px-5 py-2.5 text-sm font-bold text-white shadow-glow disabled:opacity-60">
            {saving ? "Saving…" : initial ? "Save changes" : "Create product"}
          </button>
        </div>

        <style>{`.ipt{width:100%;border:1px solid hsl(var(--border));background:hsl(var(--background));border-radius:0.75rem;padding:0.625rem 0.875rem;font-size:0.875rem;outline:none}.ipt:focus{box-shadow:0 0 0 2px hsl(var(--primary)/0.2)}`}</style>
      </motion.form>
    </motion.div>
  );
}

function CategorySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { data: opts = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.list,
    staleTime: 0,
    refetchOnMount: "always",
  });
  const options = useMemo(() => {
    const map = new Map(opts.map((c) => [c.slug, c]));
    if (value && !map.has(value)) map.set(value, { slug: value, name: value });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [opts, value]);
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className="ipt h-auto">
        <SelectValue placeholder="Select a category" />
      </SelectTrigger>
      <SelectContent>
        {options.map((c) => (
          <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={cn("block", full && "sm:col-span-2")}>
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

type GalleryItemUI = { full: string; listing: string; hash: string; dirty: boolean };

function GalleryEditor({
  gallery, activeIdx, setActiveIdx, processing, addImages, moveImage, promoteToMain, removeImage, productName, price,
}: {
  gallery: GalleryItemUI[];
  activeIdx: number;
  setActiveIdx: (i: number) => void;
  processing: boolean;
  addImages: (f: FileList | null) => void;
  moveImage: (i: number, dir: -1 | 1) => void;
  promoteToMain: (i: number) => void;
  removeImage: (i: number) => void;
  productName: string;
  price: number;
}) {
  const active = gallery[activeIdx];
  return (
    <div className="space-y-4">
      {gallery.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-[1fr_minmax(0,200px)]">
          {/* Main 1:1 preview */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Full view · 1:1</p>
            <div className="relative aspect-square overflow-hidden rounded-2xl border bg-white">
              {active ? (
                <img src={active.full} alt="" className="h-full w-full object-contain" />
              ) : (
                <div className="h-full w-full" />
              )}
              {activeIdx === 0 && active && (
                <span className="absolute left-2 top-2 rounded-full bg-indigo px-2 py-0.5 text-[10px] font-bold text-white">Main</span>
              )}
            </div>
          </div>

          {/* Listing card mock — exactly how it renders on the shop */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Listing card · 4:5</p>
            <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
              <div className="relative aspect-[4/5] bg-gradient-to-b from-secondary/60 to-secondary p-4">
                {active && <img src={active.listing} alt="" className="h-full w-full object-contain" />}
              </div>
              <div className="p-2.5">
                <p className="line-clamp-1 text-xs font-semibold">{productName}</p>
                <p className="text-sm font-black">₹{Number(price || 0).toLocaleString("en-IN")}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Thumbnail strip */}
      {gallery.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {gallery.map((g, i) => (
            <div key={g.hash || i} className="group relative shrink-0">
              <button
                type="button"
                onClick={() => setActiveIdx(i)}
                className={cn(
                  "h-16 w-16 overflow-hidden rounded-xl border-2 bg-white transition",
                  activeIdx === i ? "border-indigo shadow-glow" : "border-transparent opacity-80 hover:opacity-100",
                )}
              >
                <img src={g.full} alt="" className="h-full w-full object-contain" />
              </button>
              {i === 0 && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 rounded-full bg-indigo px-1.5 py-px text-[9px] font-bold text-white">M</span>
              )}
              <div className="absolute inset-x-0 -bottom-1 flex justify-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                {i > 0 && (
                  <button type="button" onClick={() => promoteToMain(i)} title="Set as main" className="rounded-full bg-foreground px-1.5 py-0.5 text-[9px] font-bold text-background shadow">★</button>
                )}
                <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} className="rounded-full bg-background px-1.5 py-0.5 text-[9px] shadow disabled:opacity-40">←</button>
                <button type="button" onClick={() => moveImage(i, 1)} disabled={i === gallery.length - 1} className="rounded-full bg-background px-1.5 py-0.5 text-[9px] shadow disabled:opacity-40">→</button>
                <button type="button" onClick={() => removeImage(i)} className="rounded-full bg-destructive px-1.5 py-0.5 text-[9px] text-white shadow">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <label className={cn("flex cursor-pointer items-center gap-3 rounded-xl border bg-secondary/40 px-3 py-3 text-sm hover:bg-secondary", processing && "pointer-events-none opacity-60")}>
        <Upload className="h-4 w-4" />
        <span className="flex-1">
          {processing ? "Cropping images…" : gallery.length ? "Add more images" : "Choose images (you can pick multiple)"}
        </span>
        <input type="file" accept="image/*" multiple hidden onChange={(e) => { addImages(e.target.files); e.currentTarget.value = ""; }} />
      </label>
      <p className="text-[11px] text-muted-foreground">
        Each upload is auto-cropped to a 1:1 square (full / zoom view) and a 4:5 portrait (listing card). Duplicate files are detected by content hash and skipped. The first image is sent to the backend as the main product photo.
      </p>
    </div>
  );
}
