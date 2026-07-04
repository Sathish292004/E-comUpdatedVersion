import { apiClient } from "./client";
import type { Product } from "./mock-data";
import { normalizeBackendProduct } from "./helpers";
import type { Review } from "./mock-data";

export async function listProducts(): Promise<Product[]> {
  const { data } = await apiClient.get<unknown[]>("/products");
  return (Array.isArray(data) ? data : []).map(normalizeBackendProduct);
}

export async function getProduct(id: string): Promise<Product | undefined> {
  try {
    const { data } = await apiClient.get<unknown>(`/product/${id}`);
    return normalizeBackendProduct(data);
  } catch {
    return undefined;
  }
}

export async function searchProducts(q: string): Promise<Product[]> {
  const s = q.trim();
  if (!s) return [];
  const { data } = await apiClient.get<unknown[]>(`/products/search`, { params: { keyword: s } });
  return (Array.isArray(data) ? data : []).map(normalizeBackendProduct);
}

export async function listReviews(_productId: string): Promise<Review[]> {
  // Legacy shim — actual reviews live in `reviews.ts` (backed by
  // `/api/products/{id}/reviews`). This helper stays only for callers that
  // haven't been migrated yet.
  return [];
}

// ---------------------------------------------------------------------------
// Admin / write operations — backend expects multipart with `product` JSON part
// and `imageFile` binary part.
// ---------------------------------------------------------------------------
export type ProductInput = {
  name: string;
  description?: string;
  brand?: string;
  price: number;
  category?: string;
  releaseDate?: string;
  productAvailable?: boolean;
  stockQuantity?: number;
};

function buildProductForm(p: ProductInput, image?: File | Blob): FormData {
  const fd = new FormData();
  fd.append(
    "product",
    new Blob([JSON.stringify(p)], { type: "application/json" }),
  );
  if (image) fd.append("imageFile", image);
  else fd.append("imageFile", new Blob([], { type: "application/octet-stream" }), "");
  return fd;
}

export async function createProduct(p: ProductInput, image?: File | Blob): Promise<Product> {
  const { data } = await apiClient.post<unknown>("/product", buildProductForm(p, image), {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return normalizeBackendProduct(data);
}

export async function updateProduct(id: string, p: ProductInput, image?: File | Blob): Promise<void> {
  await apiClient.put(`/product/${id}`, buildProductForm({ ...p }, image), {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/product/${id}`);
}

export type { Product };

// ---------------------------------------------------------------------------
// GET /api/products/filter — paginated + filterable listing
// ---------------------------------------------------------------------------
export type ProductFilterParams = {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  available?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: "asc" | "desc";
};

export type ProductPage = {
  products: Product[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  last: boolean;
};

export async function filterProducts(params: ProductFilterParams = {}): Promise<ProductPage> {
  const { data } = await apiClient.get<{
    success: boolean;
    message: string;
    data: { products: unknown[]; currentPage: number; totalPages: number; totalElements: number; last: boolean };
  }>("/products/filter", { params });
  const page = data?.data;
  return {
    products: (page?.products ?? []).map(normalizeBackendProduct),
    currentPage: page?.currentPage ?? 0,
    totalPages: page?.totalPages ?? 0,
    totalElements: page?.totalElements ?? 0,
    last: page?.last ?? true,
  };
}
