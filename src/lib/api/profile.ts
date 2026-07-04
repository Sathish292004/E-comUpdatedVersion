import { apiClient } from "./client";

export type CustomerProfile = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

export type ProfileUpdate = {
  name?: string;
  phone?: string;
  address?: string;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export const profileApi = {
  get: () =>
    apiClient.get<CustomerProfile>("/customer/profile").then((r) => r.data),
  update: (body: ProfileUpdate) =>
    apiClient
      .put<CustomerProfile>("/customer/profile", body)
      .then((r) => r.data),
  changePassword: (body: ChangePasswordInput) =>
    apiClient
      .put<string>("/customer/change-password", body)
      .then((r) => r.data),
};