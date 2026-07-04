import { apiClient, API_BASE_URL } from "./client";
import type { Product } from "./mock-data";

export type CartLine = { product: Product; qty: number };

// ---------------------------------------------------------------------------
// Cart API — the Spring backend is the single source of truth.
// Endpoints:
//   GET    /api/customer/cart
//   POST   /api/customer/cart/{productId}       body { quantity }
//   PUT    /api/customer/cart/{productId}       body { quantity }
//   DELETE /api/customer/cart/remove/{productId}
//   DELETE /api/customer/cart/clear
// ---------------------------------------------------------------------------

export type BackendCartItem = {
  productId: number;
  productName: string;
  brand: string;
  category: string;
  imageName?: string | null;
  quantity: number;
  price: number;
  totalPrice: number;
  productAvailable: boolean;
};

export type BackendCartResponse = {
  items: BackendCartItem[];
  totalItems: number;
  totalAmount: number;
};

export type CartSnapshot = {
  items: CartLine[];
  totalItems: number;
  totalAmount: number;
};

export const cartQueryKeys = {
  all: ["cart"] as const,
};

function unwrap<T>(data: any): T {
  // Spring wraps most responses as { success, message, data }
  if (data && typeof data === "object" && "data" in data && (("success" in data) || ("message" in data))) {
    return data.data as T;
  }
  return data as T;
}

function toProduct(it: BackendCartItem): Product {
  const id = String(it.productId);
  return {
    id,
    name: it.productName,
    brand: it.brand,
    category: it.category,
    price: Number(it.price ?? 0),
    images: [`${API_BASE_URL}/product/${id}/image`],
    productAvailable: it.productAvailable,
  };
}

function toSnapshot(raw: BackendCartResponse | null | undefined): CartSnapshot {
  const items = (raw?.items ?? []).map<CartLine>((it) => ({
    product: toProduct(it),
    qty: Number(it.quantity ?? 0),
  }));
  return {
    items,
    totalItems: Number(raw?.totalItems ?? items.reduce((s, i) => s + i.qty, 0)),
    totalAmount: Number(raw?.totalAmount ?? items.reduce((s, i) => s + i.product.price * i.qty, 0)),
  };
}

export async function getCart(): Promise<CartSnapshot> {
  const { data } = await apiClient.get("/customer/cart");
  return toSnapshot(unwrap<BackendCartResponse>(data));
}

export async function addCartItem(productId: string | number, quantity = 1): Promise<void> {
  await apiClient.post(`/customer/cart/${Number(productId)}`, { quantity });
}

export async function updateCartItem(productId: string | number, quantity: number): Promise<void> {
  await apiClient.put(`/customer/cart/${Number(productId)}`, { quantity });
}

export async function removeCartItem(productId: string | number): Promise<void> {
  await apiClient.delete(`/customer/cart/remove/${Number(productId)}`);
}

export async function clearCartApi(): Promise<void> {
  await apiClient.delete(`/customer/cart/clear`);
}