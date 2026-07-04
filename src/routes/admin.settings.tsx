import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Save, Upload, ZoomIn, ZoomOut, RotateCcw, Check, X } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api/client";
import { loadSettings, saveSettings, defaultSettings, type StoreSettings } from "@/lib/admin-settings";

export const Route = createFileRoute("/admin/settings")({ component: Settings });

function fileToDataUrl(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(f);
  });
}

/** Downscale + JPEG-encode so the result fits comfortably in localStorage. */
async function downscaleImage(file: File, maxW: number, maxH: number, quality = 0.85): Promise<string> {
  const src = await fileToDataUrl(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });
  const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
  const w = Math.max(1, Math.round(img.width * ratio));
  const h = Math.max(1, Math.round(img.height * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

function Settings() {
  const [s, setS] = useState<StoreSettings>(defaultSettings);
  useEffect(() => { setS(loadSettings()); }, []);
  const set = <K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) => setS((p) => ({ ...p, [k]: v }));
  const setSocial = (k: keyof StoreSettings["social"], v: string) => setS((p) => ({ ...p, social: { ...p.social, [k]: v } }));

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    try { saveSettings(s); toast.success("Settings saved"); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Save failed"); }
  };

  const [editor, setEditor] = useState<null | { kind: "logoUrl" | "bannerUrl"; src: string }>(null);
  const onPickImage = async (key: "logoUrl" | "bannerUrl", f?: File) => {
    if (!f) return;
    try {
      // Downscale so the data URL fits in localStorage (avoids QuotaExceededError).
      const url =
        key === "logoUrl"
          ? await downscaleImage(f, 512, 512, 0.9)
          : await downscaleImage(f, 1920, 900, 0.82);
      console.log("[sk:settings] uploaded", key, {
        originalBytes: f.size,
        encodedBytes: url.length,
      });
      const next = { ...s, [key]: url } as StoreSettings;
      setS(next);
      saveSettings(next); // throws on quota errors — caught below
      toast.success(`${key === "logoUrl" ? "Logo" : "Banner"} updated`);
      setEditor({ kind: key, src: url });
    } catch (err) {
      console.error("[sk:settings] upload failed", err);
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  };

  return (
    <form onSubmit={onSave} className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage store identity, contact, policies and theme.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-full bg-gradient-cta px-5 py-2.5 text-sm font-bold text-white shadow-glow"><Save className="h-4 w-4" />Save changes</button>
      </div>

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 rounded-3xl border bg-card p-6 shadow-card">
        <h2 className="text-lg font-bold">Brand</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Store name"><input value={s.storeName} onChange={(e) => set("storeName", e.target.value)} className="input" /></Field>
          <Field label="Currency">
            <select value={s.currency} onChange={(e) => set("currency", e.target.value as any)} className="input">
              <option value="INR">INR — Indian Rupee</option>
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </Field>
          <Field label="Store description" full>
            <textarea rows={2} value={s.storeDescription} onChange={(e) => set("storeDescription", e.target.value)} className="input" />
          </Field>
          <ImageField label="Logo" url={s.logoUrl}
            onPick={(f) => onPickImage("logoUrl", f)}
            onClear={() => { const next = { ...s, logoUrl: "" }; setS(next); saveSettings(next); toast.success("Logo removed"); }}
            onEdit={() => s.logoUrl && setEditor({ kind: "logoUrl", src: s.logoUrl })} />
          <ImageField label="Banner" url={s.bannerUrl}
            onPick={(f) => onPickImage("bannerUrl", f)}
            onClear={() => { const next = { ...s, bannerUrl: "" }; setS(next); saveSettings(next); toast.success("Banner removed"); }}
            onEdit={() => s.bannerUrl && setEditor({ kind: "bannerUrl", src: s.bannerUrl })} />
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 rounded-3xl border bg-card p-6 shadow-card">
        <h2 className="text-lg font-bold">Contact</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contact email"><input type="email" value={s.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} className="input" /></Field>
          <Field label="Phone"><input value={s.phone} onChange={(e) => set("phone", e.target.value)} className="input" /></Field>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 rounded-3xl border bg-card p-6 shadow-card">
        <h2 className="text-lg font-bold">Theme</h2>
        <Field label="Theme preference">
          <select value={s.theme} onChange={(e) => set("theme", e.target.value as any)} className="input">
            <option value="system">Follow system</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </Field>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 rounded-3xl border bg-card p-6 shadow-card">
        <h2 className="text-lg font-bold">Social links</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Instagram"><input value={s.social.instagram} onChange={(e) => setSocial("instagram", e.target.value)} className="input" placeholder="https://instagram.com/…" /></Field>
          <Field label="Twitter / X"><input value={s.social.twitter} onChange={(e) => setSocial("twitter", e.target.value)} className="input" placeholder="https://x.com/…" /></Field>
          <Field label="Facebook"><input value={s.social.facebook} onChange={(e) => setSocial("facebook", e.target.value)} className="input" placeholder="https://facebook.com/…" /></Field>
          <Field label="YouTube"><input value={s.social.youtube} onChange={(e) => setSocial("youtube", e.target.value)} className="input" placeholder="https://youtube.com/…" /></Field>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 rounded-3xl border bg-card p-6 shadow-card">
        <h2 className="text-lg font-bold">Policies & footer</h2>
        <Field label="Footer content"><textarea rows={2} value={s.footer} onChange={(e) => set("footer", e.target.value)} className="input" /></Field>
        <Field label="Shipping information"><textarea rows={3} value={s.shipping} onChange={(e) => set("shipping", e.target.value)} className="input" /></Field>
        <Field label="Return policy"><textarea rows={3} value={s.returns} onChange={(e) => set("returns", e.target.value)} className="input" /></Field>
        <Field label="Privacy policy"><textarea rows={3} value={s.privacy} onChange={(e) => set("privacy", e.target.value)} className="input" /></Field>
      </motion.section>

      <section className="rounded-3xl border bg-card p-6 shadow-card">
        <h2 className="text-lg font-bold">Backend connection</h2>
        <p className="mt-1 text-xs text-muted-foreground">Configured via <code>VITE_API_URL</code>. All data is fetched live from the Spring Boot backend.</p>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-xl border bg-secondary/40 p-3">
            <dt className="text-xs font-bold uppercase text-muted-foreground">API base URL</dt>
            <dd className="font-mono text-xs break-all">{API_BASE_URL}</dd>
          </div>
          <div className="rounded-xl border bg-secondary/40 p-3">
            <dt className="text-xs font-bold uppercase text-muted-foreground">Mode</dt>
            <dd className="font-semibold">Live Spring Boot</dd>
          </div>
        </dl>
      </section>

      <style>{`.input{width:100%;border:1px solid hsl(var(--border));background:hsl(var(--background));border-radius:0.75rem;padding:0.625rem 0.875rem;font-size:0.875rem;outline:none}.input:focus{box-shadow:0 0 0 2px hsl(var(--primary)/0.2)}`}</style>
      {editor && (
        <CropEditor
          kind={editor.kind}
          src={editor.src}
          onCancel={() => setEditor(null)}
          onApply={(dataUrl) => {
            try {
              const next = { ...s, [editor.kind]: dataUrl } as StoreSettings;
              setS(next);
              // Persist immediately so Navbar, Admin sidebar, favicon and
              // hero/banner surfaces update live via the `sk:settings` event.
              saveSettings(next);
              setEditor(null);
              toast.success(`${editor.kind === "logoUrl" ? "Logo" : "Banner"} updated successfully`);
            } catch (err) {
              console.error(err);
              toast.error(`Failed to save ${editor.kind === "logoUrl" ? "logo" : "banner"}. Please try again.`);
              // Keep the crop dialog open with the current selection intact.
            }
          }}
        />
      )}
    </form>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={"block " + (full ? "sm:col-span-2" : "")}>
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function ImageField({ label, url, onPick, onClear, onEdit }: { label: string; url: string; onPick: (f?: File) => void; onClear: () => void; onEdit: () => void }) {
  return (
    <Field label={label} full={label === "Banner"}>
      <div className="flex items-center gap-3">
        {url ? (
          <img src={url} alt={label} className="h-14 w-14 rounded-xl border object-cover" />
        ) : (
          <div className="grid h-14 w-14 place-items-center rounded-xl border bg-secondary/40 text-[10px] text-muted-foreground">none</div>
        )}
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border bg-secondary/40 px-3 py-2 text-xs font-semibold hover:bg-secondary">
          <Upload className="h-3.5 w-3.5" />Upload
          <input type="file" accept="image/*" hidden onChange={(e) => onPick(e.target.files?.[0])} />
        </label>
        {url && <button type="button" onClick={onEdit} className="rounded-xl border bg-secondary/40 px-3 py-2 text-xs font-semibold hover:bg-secondary">Crop & resize</button>}
        {url && <button type="button" onClick={onClear} className="text-xs font-semibold text-muted-foreground hover:text-destructive">Remove</button>}
      </div>
    </Field>
  );
}

/* ---------------- Crop editor ---------------- */

type CropKind = "logoUrl" | "bannerUrl";

const SPECS: Record<CropKind, { label: string; aspect: number; frameW: number; frameH: number; outW: number; outH: number; mime: "image/png" | "image/jpeg"; bg: string }> = {
  logoUrl:   { label: "Logo",   aspect: 1,        frameW: 320, frameH: 320, outW: 512,  outH: 512, mime: "image/png",  bg: "transparent" },
  bannerUrl: { label: "Banner", aspect: 21 / 9,   frameW: 640, frameH: 274, outW: 1920, outH: 823, mime: "image/jpeg", bg: "#0b0b0f" },
};

function CropEditor({ kind, src, onCancel, onApply }: { kind: CropKind; src: string; onCancel: () => void; onApply: (dataUrl: string) => void }) {
  const spec = SPECS[kind];
  const frameRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dirty, setDirty] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  // Responsive frame size: fits available stage width while preserving aspect.
  const [frame, setFrame] = useState({ w: spec.frameW, h: spec.frameH });
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const avail = Math.max(220, el.clientWidth - 4);
      const w = Math.min(spec.frameW, avail);
      const h = Math.round(w / spec.aspect);
      setFrame({ w, h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [spec.frameW, spec.aspect]);

  useEffect(() => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => setImg(i);
    i.src = src;
  }, [src]);

  const base = useMemo(() => {
    if (!img) return { s0: 1, dw: frame.w, dh: frame.h };
    const s0 = Math.max(frame.w / img.width, frame.h / img.height);
    return { s0, dw: img.width * s0, dh: img.height * s0 };
  }, [img, frame.w, frame.h]);

  const dw = base.dw * zoom;
  const dh = base.dh * zoom;

  const clamp = (x: number, y: number) => ({
    x: Math.min(0, Math.max(frame.w - dw, x)),
    y: Math.min(0, Math.max(frame.h - dh, y)),
  });

  // Recenter when zoom or image changes
  useEffect(() => {
    setOffset(clamp((frame.w - dw) / 2, (frame.h - dh) / 2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img, zoom, frame.w, frame.h]);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setOffset(clamp(dragRef.current.ox + dx, dragRef.current.oy + dy));
    if (!dirty && (dx !== 0 || dy !== 0)) setDirty(true);
  };
  const onPointerUp = () => { dragRef.current = null; };

  const reset = () => { setZoom(1); setDirty(true); };

  const render = (): string => {
    if (!img) return src;
    const scale = spec.outW / frame.w;
    const canvas = document.createElement("canvas");
    canvas.width = spec.outW;
    canvas.height = spec.outH;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    if (spec.mime === "image/jpeg") {
      ctx.fillStyle = spec.bg;
      ctx.fillRect(0, 0, spec.outW, spec.outH);
    } else {
      ctx.clearRect(0, 0, spec.outW, spec.outH);
    }
    ctx.drawImage(img, offset.x * scale, offset.y * scale, dw * scale, dh * scale);
    return canvas.toDataURL(spec.mime, 0.92);
  };

  const apply = () => onApply(render());
  const tryClose = () => { if (dirty) setConfirmClose(true); else onCancel(); };

  // Esc to close (with confirm if dirty)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") tryClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty]);

  // Throttled low-res preview of the actual cropped output, used in
  // all "Live preview" surfaces so non-matching aspect ratios still
  // show the correct fit (with CSS object-cover).
  const [previewUrl, setPreviewUrl] = useState<string>("");
  useEffect(() => {
    if (!img) return;
    const raf = requestAnimationFrame(() => {
      const w = Math.min(480, spec.outW);
      const h = Math.round(w * (spec.outH / spec.outW));
      const scale = w / frame.w;
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      const ctx = c.getContext("2d")!;
      ctx.imageSmoothingQuality = "medium";
      if (spec.mime === "image/jpeg") { ctx.fillStyle = spec.bg; ctx.fillRect(0, 0, w, h); }
      else ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, offset.x * scale, offset.y * scale, dw * scale, dh * scale);
      setPreviewUrl(c.toDataURL(spec.mime === "image/png" ? "image/png" : "image/jpeg", 0.8));
    });
    return () => cancelAnimationFrame(raf);
  }, [img, offset.x, offset.y, dw, dh, spec.bg, spec.mime, frame.w, spec.outW, spec.outH]);

  const Img = ({ className, style }: { className?: string; style?: React.CSSProperties }) =>
    previewUrl
      ? <img src={previewUrl} alt="" className={"h-full w-full object-cover " + (className ?? "")} style={style} />
      : <div className={"h-full w-full bg-secondary/40 " + (className ?? "")} style={style} />;

  return (
    <div className="fixed inset-0 z-[120] flex items-stretch justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={tryClose}>
      <div className="flex max-h-[100dvh] w-full max-w-5xl flex-col overflow-hidden rounded-none border bg-card shadow-2xl sm:max-h-[92vh] sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-between border-b px-4 py-3 sm:px-5">
          <div>
            <h3 className="text-sm font-black sm:text-base">Crop & resize {spec.label.toLowerCase()}</h3>
            <p className="hidden text-xs text-muted-foreground sm:block">Drag to reposition · scroll or use the slider to zoom · live previews on the right</p>
          </div>
          <button type="button" aria-label="Close" onClick={tryClose} className="rounded-full p-2 hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>

        <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* Editor */}
          <div ref={stageRef} className="min-w-0 space-y-4">
            <div
              ref={frameRef}
              className="relative mx-auto select-none overflow-hidden rounded-2xl border bg-[conic-gradient(at_25%_25%,#1118_25%,transparent_0_50%,#1118_0_75%,transparent_0)] bg-[length:16px_16px] touch-none"
              style={{ width: frame.w, height: frame.h, cursor: dragRef.current ? "grabbing" : "grab" }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onWheel={(e) => { e.preventDefault(); setZoom((z) => Math.min(4, Math.max(1, z - e.deltaY * 0.002))); setDirty(true); }}
            >
              {img && (
                <img
                  src={src}
                  alt=""
                  draggable={false}
                  className="absolute origin-top-left max-w-none"
                  style={{ width: dw, height: dh, transform: `translate(${offset.x}px, ${offset.y}px)` }}
                />
              )}
              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/40" />
            </div>

            <div className="flex items-center gap-3 text-xs">
              <button type="button" onClick={() => { setZoom((z) => Math.max(1, z - 0.1)); setDirty(true); }} className="rounded-lg border p-1.5 hover:bg-secondary"><ZoomOut className="h-3.5 w-3.5" /></button>
              <input type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => { setZoom(parseFloat(e.target.value)); setDirty(true); }} className="flex-1 accent-primary" />
              <button type="button" onClick={() => { setZoom((z) => Math.min(4, z + 0.1)); setDirty(true); }} className="rounded-lg border p-1.5 hover:bg-secondary"><ZoomIn className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={reset} className="ml-1 inline-flex items-center gap-1 rounded-lg border px-2 py-1 hover:bg-secondary"><RotateCcw className="h-3 w-3" />Reset</button>
            </div>
            <p className="text-[10px] text-muted-foreground">Output: {spec.outW}×{spec.outH} · {spec.mime.split("/")[1].toUpperCase()}</p>
          </div>

          {/* Live previews */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Live preview</h4>
            {kind === "logoUrl" ? (
              <>
                <PreviewCard title="Navbar">
                  <div className="flex items-center gap-3 rounded-2xl border bg-background px-4 py-2.5">
                    <div className="h-9 w-9 overflow-hidden rounded-xl border"><Img /></div>
                    <span className="text-sm font-black tracking-tight">SK Store</span>
                  </div>
                </PreviewCard>
                <PreviewCard title="Admin sidebar">
                  <div className="flex items-center gap-3 rounded-2xl border bg-background px-4 py-3">
                    <div className="h-10 w-10 overflow-hidden rounded-full border ring-2 ring-primary/30"><Img /></div>
                    <div>
                      <div className="text-sm font-black">SK Admin</div>
                      <div className="text-[10px] text-muted-foreground">Dashboard</div>
                    </div>
                  </div>
                </PreviewCard>
                <PreviewCard title="Favicon">
                  <div className="flex items-center gap-3 rounded-xl border bg-background px-3 py-2">
                    <div className="h-4 w-4 overflow-hidden rounded-sm border"><Img /></div>
                    <span className="text-xs text-muted-foreground">sk-store.com</span>
                  </div>
                </PreviewCard>
              </>
            ) : (
              <>
                <PreviewCard title="Home hero">
                  <div className="relative overflow-hidden rounded-2xl border" style={{ aspectRatio: "21/9" }}>
                    <div className="absolute inset-0"><Img /></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <div className="absolute bottom-3 left-3 text-white">
                      <div className="text-[10px] uppercase tracking-widest opacity-80">New season</div>
                      <div className="text-lg font-black">Premium picks</div>
                    </div>
                  </div>
                </PreviewCard>
                <PreviewCard title="Shop banner strip">
                  <div className="relative overflow-hidden rounded-2xl border" style={{ aspectRatio: "5/1" }}>
                    <div className="absolute inset-0"><Img /></div>
                  </div>
                </PreviewCard>
                <PreviewCard title="Auth artwork">
                  <div className="relative h-40 overflow-hidden rounded-2xl border">
                    <div className="absolute inset-0"><Img /></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
                  </div>
                </PreviewCard>
              </>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 flex shrink-0 items-center justify-end gap-2 border-t bg-secondary/30 px-4 py-3 sm:px-5" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
          <button type="button" onClick={tryClose} className="flex-1 rounded-full border bg-background px-4 py-2.5 text-xs font-bold hover:bg-secondary sm:flex-none">Cancel</button>
          <button type="button" onClick={apply} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-cta px-4 py-2.5 text-xs font-bold text-white shadow-glow sm:flex-none"><Check className="h-3.5 w-3.5" />Apply</button>
        </div>
      </div>

      {confirmClose && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 p-4" onClick={(e) => { e.stopPropagation(); setConfirmClose(false); }}>
          <div className="w-full max-w-sm rounded-2xl border bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-base font-black">Discard your changes?</h4>
            <p className="mt-1 text-xs text-muted-foreground">Your crop adjustments will be lost.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmClose(false)} className="rounded-full border bg-background px-4 py-2 text-xs font-bold hover:bg-secondary">Keep editing</button>
              <button type="button" onClick={() => { setConfirmClose(false); onCancel(); }} className="rounded-full bg-destructive px-4 py-2 text-xs font-bold text-destructive-foreground hover:opacity-90">Discard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}