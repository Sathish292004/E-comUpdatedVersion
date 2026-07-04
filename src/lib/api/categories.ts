import { apiClient } from "./client";

export type Category = {
  id?: number;
  name: string;
  slug: string;
  icon?: string;
};

export const categoriesApi = {
  list: () => apiClient.get<Category[]>("/categories").then((r) => r.data ?? []),
  get: (id: number) => apiClient.get<Category>(`/category/${id}`).then((r) => r.data),
  create: (data: Category) => apiClient.post<Category>("/category", data).then((r) => r.data),
  update: (id: number, data: Category) =>
    apiClient.put<Category>(`/category/${id}`, data).then((r) => r.data),
  remove: (id: number) => apiClient.delete<void>(`/category/${id}`).then((r) => r.data),
  search: (keyword: string) =>
    apiClient
      .get<Category[]>("/categories/search", { params: { keyword } })
      .then((r) => r.data ?? []),
};
