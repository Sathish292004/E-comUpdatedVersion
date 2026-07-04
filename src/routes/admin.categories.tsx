import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Edit2, Trash2, Search, X } from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { categoriesApi, type Category } from "@/lib/api/categories";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/categories")({ component: Cats });

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function Cats() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);
  const trimmed = q.trim();
  const { data: items = [], isLoading: loading } = useQuery({
    queryKey: trimmed ? ["categories", "search", trimmed] : ["categories"],
    queryFn: () => (trimmed ? categoriesApi.search(trimmed) : categoriesApi.list()),
  });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["categories"] });

  const onDelete = async (cat: Category) => {
    if (cat.id == null) return;
    if (!confirm("Delete this category?")) return;
    try {
      await categoriesApi.remove(cat.id);
      toast.success("Category deleted");
      invalidate();
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete category");
    }
  };

  const onSave = async (cat: Category) => {
    if (!cat.name.trim()) { toast.error("Name required"); return; }
    const payload: Category = { ...cat, slug: cat.slug || slugify(cat.name) };
    try {
      if (editing?.id != null) {
        await categoriesApi.update(editing.id, payload);
        toast.success("Category updated");
      } else {
        await categoriesApi.create(payload);
        toast.success("Category added");
      }
      setOpen(false);
      setEditing(null);
      invalidate();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save category");
    }
  };

  const filtered = items;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Categories</h1>
          <p className="text-sm text-muted-foreground">{loading ? "Loading…" : `${filtered.length} categories — organize your storefront`}</p>
        </div>
        <button onClick={() => { setEditing(null); setOpen(true); }} className="inline-flex items-center gap-2 rounded-full bg-gradient-cta px-5 py-2.5 text-sm font-bold text-white shadow-glow"><Plus className="h-4 w-4" />New category</button>
      </div>
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search categories…" className="w-full rounded-full border bg-background px-9 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo/20" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c, i) => (
          <motion.div key={c.id ?? c.slug} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-3xl border bg-card p-5 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl">{c.icon || ["👟","👕","⌚","🎧","🎒","👓","🛍️","✨"][i % 8]}</p>
                <p className="mt-2 text-base font-bold">{c.name}</p>
                <p className="text-xs text-muted-foreground">/{c.slug}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditing(c); setOpen(true); }} className="grid h-8 w-8 place-items-center rounded-full hover:bg-secondary"><Edit2 className="h-3.5 w-3.5" /></button>
                <button onClick={() => onDelete(c)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {open && <CategoryForm initial={editing} onSave={onSave} onClose={() => { setOpen(false); setEditing(null); }} />}
      </AnimatePresence>
    </div>
  );
}

function CategoryForm({ initial, onSave, onClose }: { initial: Category | null; onSave: (c: Category) => void; onClose: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm">
      <motion.form initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); onSave({ name, slug, icon }); }} className="w-full max-w-md rounded-3xl border bg-card p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black">{initial ? "Edit category" : "New category"}</h2>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>
        <label className="block text-xs font-bold uppercase text-muted-foreground">Name</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo/20" />
        <label className="mt-4 block text-xs font-bold uppercase text-muted-foreground">Slug</label>
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={slugify(name) || "auto"} className="mt-1.5 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo/20" />
        <label className="mt-4 block text-xs font-bold uppercase text-muted-foreground">Icon</label>
        <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="e.g. 👟 or icon name" className="mt-1.5 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo/20" />
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full border bg-background px-5 py-2.5 text-sm font-semibold hover:bg-secondary">Cancel</button>
          <button type="submit" className="rounded-full bg-gradient-cta px-5 py-2.5 text-sm font-bold text-white shadow-glow">{initial ? "Save" : "Create"}</button>
        </div>
      </motion.form>
    </motion.div>
  );
}
