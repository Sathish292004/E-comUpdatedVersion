import { apiClient } from "./client";

export type WishlistItem = {
  productId: number;
  productName: string;
  brand: string;
  category: string;
  price: number;
  imageName: string | null;
  productAvailable: boolean;
};

export const wishlistApi = {
  list: () =>
    apiClient.get<WishlistItem[]>("/customer/wishlist").then((r) => r.data ?? []),
  add: (productId: number) =>
    apiClient.post<string>(`/customer/wishlist/${productId}`).then((r) => r.data),
  remove: (productId: number) =>
    apiClient.delete<string>(`/customer/wishlist/${productId}`).then((r) => r.data),
};