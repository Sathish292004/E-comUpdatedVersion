import type { Product } from "./mock-data";
import { API_BASE_URL } from "./client";

const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'><rect width='4' height='5' fill='%23e5e7eb'/></svg>",
  );

/** Returns the i-th image for a product. Falls back to backend image endpoint, then a placeholder. */
export function productImage(p: Pick<Product, "id" | "images">, i = 0): string {
  const arr = p.images;
  if (arr && arr[i]) return arr[i];
  if (arr && arr[0]) return arr[0];
  if (p.id) return `${API_BASE_URL}/product/${p.id}/image`;
  return PLACEHOLDER;
}

/** Convenience getters with safe defaults for optional Product fields. */
export const prodMrp = (p: Product) => p.mrp ?? p.price;
export const prodRating = (p: Product) => p.rating ?? 0;
export const prodReviews = (p: Product) => p.reviews ?? 0;
export const prodStock = (p: Product) =>
  p.stock ?? (p.productAvailable === false ? 0 : 99);
export const prodColors = (p: Product) => p.colors ?? [];
export const prodSizes = (p: Product) => p.sizes ?? [];
export const prodTags = (p: Product) => p.tags ?? [];
export const prodSpecs = (p: Product) => p.specs ?? [];
export const prodDescription = (p: Product) => p.description ?? "";

/** % off, 0 when no MRP or MRP <= price. */
export function discountPct(p: Product): number {
  const mrp = p.mrp;
  if (!mrp || mrp <= p.price) return 0;
  return Math.round(((mrp - p.price) / mrp) * 100);
}

/** Normalise a raw backend Product into the frontend Product shape. */
export function normalizeBackendProduct(raw: any): Product {
  const id = String(raw?.id ?? "");
  const price = Number(raw?.price ?? 0);
  const released = raw?.releaseDate ? new Date(raw.releaseDate) : null;
  const isNew = released
    ? Date.now() - released.getTime() < 1000 * 60 * 60 * 24 * 30
    : false;
  return {
    id,
    name: String(raw?.name ?? "Untitled"),
    brand: String(raw?.brand ?? ""),
    category: String(raw?.category ?? ""),
    price,
    description: raw?.description ?? "",
    stock: Number(raw?.stockQuantity ?? 0),
    productAvailable: Boolean(raw?.productAvailable),
    releaseDate: raw?.releaseDate,
    images: id ? [`${API_BASE_URL}/product/${id}/image`] : [],
    isNew,
  };
}