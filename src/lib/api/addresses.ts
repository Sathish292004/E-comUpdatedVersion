import { apiClient } from "./client";

export type Address = {
  id: number;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  defaultAddress: boolean;
};

export type AddressInput = Omit<Address, "id">;

export const addressesApi = {
  list: () =>
    apiClient.get<Address[]>("/customer/addresses").then((r) => r.data ?? []),
  add: (body: AddressInput) =>
    apiClient.post<Address>("/customer/addresses", body).then((r) => r.data),
  update: (id: number, body: AddressInput) =>
    apiClient
      .put<Address>(`/customer/addresses/${id}`, body)
      .then((r) => r.data),
  remove: (id: number) =>
    apiClient
      .delete<string>(`/customer/addresses/${id}`)
      .then((r) => r.data),
};