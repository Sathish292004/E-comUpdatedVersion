export type StoreSettings = {
  storeName: string;
  storeDescription: string;
  logoUrl: string;
  bannerUrl: string;
  contactEmail: string;
  phone: string;
  currency: "INR" | "USD" | "EUR";
  theme: "system" | "light" | "dark";
  social: { instagram: string; twitter: string; facebook: string; youtube: string };
  footer: string;
  shipping: string;
  returns: string;
  privacy: string;
};

const KEY = "sk_store_settings_v1";

export const defaultSettings: StoreSettings = {
  storeName: "SK Store",
  storeDescription: "Premium e-commerce — sneakers, apparel, audio and more.",
  logoUrl: "",
  bannerUrl: "",
  contactEmail: "support@sk-store.com",
  phone: "+91 90000 00000",
  currency: "INR",
  theme: "system",
  social: { instagram: "", twitter: "", facebook: "", youtube: "" },
  footer: "© SK Store. All rights reserved.",
  shipping: "Free shipping on orders above ₹999. Delivered in 3–5 business days.",
  returns: "Easy 14-day returns on unused items in original packaging.",
  privacy: "We respect your privacy. Your data is never sold to third parties.",
};

export function loadSettings(): StoreSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(s: StoreSettings) {
  const payload = JSON.stringify(s);
  try {
    localStorage.setItem(KEY, payload);
  } catch (err) {
    // Most common: QuotaExceededError — data URL is too big for localStorage (~5MB).
    console.error("[sk:settings] saveSettings FAILED", err, {
      bytes: payload.length,
      logoBytes: s.logoUrl?.length ?? 0,
      bannerBytes: s.bannerUrl?.length ?? 0,
    });
    throw new Error(
      "Could not save settings — the image is too large for browser storage. Try a smaller file."
    );
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("sk:settings", { detail: s }));
    if (window.location.search.includes("debug=settings") || localStorage.getItem("sk_debug_settings") === "1") {
      console.log("%c[sk:settings] saveSettings → dispatched", "color:#10b981;font-weight:bold", {
        logoUrl: !!s.logoUrl,
        bannerUrl: !!s.bannerUrl,
        storeName: s.storeName,
        bytes: payload.length,
      });
    }
  }
}

// Categories (local CRUD until backend ships endpoints)
export type AdminCategory = { slug: string; name: string; description?: string; count?: number };
const CAT_KEY = "sk_admin_categories_v1";

export function loadCategories(seed: AdminCategory[]): AdminCategory[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(CAT_KEY);
    return raw ? JSON.parse(raw) : seed;
  } catch { return seed; }
}

export function saveCategories(c: AdminCategory[]) {
  try { localStorage.setItem(CAT_KEY, JSON.stringify(c)); } catch {}
}

// Per-order admin overrides (status changes) — local only
const ORDER_KEY = "sk_admin_order_overrides_v1";
export type OrderOverrides = Record<string, { status?: string; cancelled?: boolean }>;
export function loadOrderOverrides(): OrderOverrides {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(ORDER_KEY) || "{}"); } catch { return {}; }
}
export function saveOrderOverrides(o: OrderOverrides) {
  try { localStorage.setItem(ORDER_KEY, JSON.stringify(o)); } catch {}
}

// Admin profile (local)
export type AdminProfile = { name: string; email: string; phone: string; avatarUrl: string };
const PROFILE_KEY = "sk_admin_profile_v1";
export const defaultAdminProfile: AdminProfile = {
  name: "SK Admin", email: "admin@skstore.com", phone: "", avatarUrl: "",
};
export function loadAdminProfile(): AdminProfile {
  if (typeof window === "undefined") return defaultAdminProfile;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? { ...defaultAdminProfile, ...JSON.parse(raw) } : defaultAdminProfile;
  } catch { return defaultAdminProfile; }
}
export function saveAdminProfile(p: AdminProfile) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch {}
}

// Per-product gallery overrides (local) — extra images beyond the single
// `imageFile` the backend supports. Stored as data URLs or remote URLs.
const GALLERY_KEY = "sk_product_gallery_v1";
const LISTING_KEY = "sk_product_listing_v1";
const HASH_KEY = "sk_product_hash_v1";
const GALLERY_WEBP_KEY = "sk_product_gallery_webp_v1";
const GALLERY_AVIF_KEY = "sk_product_gallery_avif_v1";
const LISTING_WEBP_KEY = "sk_product_listing_webp_v1";
const LISTING_AVIF_KEY = "sk_product_listing_avif_v1";
type GalleryMap = Record<string, string[]>;
function loadGalleryMap(): GalleryMap {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(GALLERY_KEY) || "{}"); } catch { return {}; }
}
function saveGalleryMap(m: GalleryMap) {
  try { localStorage.setItem(GALLERY_KEY, JSON.stringify(m)); } catch {}
}
export function loadProductGallery(id: string): string[] {
  return loadGalleryMap()[id] ?? [];
}
export function saveProductGallery(id: string, urls: string[]) {
  const m = loadGalleryMap();
  if (urls.length) m[id] = urls; else delete m[id];
  saveGalleryMap(m);
}

function loadKVMap(key: string): GalleryMap {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; }
}
function saveKVMap(key: string, m: GalleryMap) {
  try { localStorage.setItem(key, JSON.stringify(m)); } catch {}
}

/** 4:5 portrait variants for listing cards (parallel to gallery). */
export function loadProductListing(id: string): string[] {
  return loadKVMap(LISTING_KEY)[id] ?? [];
}
export function saveProductListing(id: string, urls: string[]) {
  const m = loadKVMap(LISTING_KEY);
  if (urls.length) m[id] = urls; else delete m[id];
  saveKVMap(LISTING_KEY, m);
}

/** Content hashes for uploaded files (dedupe). */
export function loadProductHashes(id: string): string[] {
  return loadKVMap(HASH_KEY)[id] ?? [];
}
export function saveProductHashes(id: string, hashes: string[]) {
  const m = loadKVMap(HASH_KEY);
  if (hashes.length) m[id] = hashes; else delete m[id];
  saveKVMap(HASH_KEY, m);
}

/**
 * Optional modern-format variants stored parallel to the JPEG arrays.
 * Each entry is the data URL (or remote URL) for that slot; an empty
 * string at index `i` means the format is unavailable for that slot.
 */
export function loadProductGalleryWebp(id: string): string[] { return loadKVMap(GALLERY_WEBP_KEY)[id] ?? []; }
export function saveProductGalleryWebp(id: string, urls: string[]) {
  const m = loadKVMap(GALLERY_WEBP_KEY);
  if (urls.some(Boolean)) m[id] = urls; else delete m[id];
  saveKVMap(GALLERY_WEBP_KEY, m);
}
export function loadProductGalleryAvif(id: string): string[] { return loadKVMap(GALLERY_AVIF_KEY)[id] ?? []; }
export function saveProductGalleryAvif(id: string, urls: string[]) {
  const m = loadKVMap(GALLERY_AVIF_KEY);
  if (urls.some(Boolean)) m[id] = urls; else delete m[id];
  saveKVMap(GALLERY_AVIF_KEY, m);
}
export function loadProductListingWebp(id: string): string[] { return loadKVMap(LISTING_WEBP_KEY)[id] ?? []; }
export function saveProductListingWebp(id: string, urls: string[]) {
  const m = loadKVMap(LISTING_WEBP_KEY);
  if (urls.some(Boolean)) m[id] = urls; else delete m[id];
  saveKVMap(LISTING_WEBP_KEY, m);
}
export function loadProductListingAvif(id: string): string[] { return loadKVMap(LISTING_AVIF_KEY)[id] ?? []; }
export function saveProductListingAvif(id: string, urls: string[]) {
  const m = loadKVMap(LISTING_AVIF_KEY);
  if (urls.some(Boolean)) m[id] = urls; else delete m[id];
  saveKVMap(LISTING_AVIF_KEY, m);
}

/** Per-slot source set bundling jpeg + optional webp + optional avif. */
export type LocalSourceSet = { jpeg: string; webp?: string; avif?: string };

function bundle(jpeg: string[], webp: string[], avif: string[]): LocalSourceSet[] {
  return jpeg.map((j, i) => ({
    jpeg: j,
    webp: webp[i] || undefined,
    avif: avif[i] || undefined,
  }));
}

export function loadProductFullSources(id: string): LocalSourceSet[] {
  return bundle(loadProductGallery(id), loadProductGalleryWebp(id), loadProductGalleryAvif(id));
}
export function loadProductListingSources(id: string): LocalSourceSet[] {
  return bundle(loadProductListing(id), loadProductListingWebp(id), loadProductListingAvif(id));
}