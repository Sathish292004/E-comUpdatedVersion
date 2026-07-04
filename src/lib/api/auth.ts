import { apiClient } from "./client";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
};

export type AuthResponse = { user: AuthUser; token: string };

export async function login(email: string, _password: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<{
    token: string;
    name: string;
    email: string;
    role: string;
  }>("/auth/login", { email, password: _password });
  return {
    token: data.token,
    user: {
      id: data.email,
      name: data.name,
      email: data.email,
      role: (data.role ?? "").toUpperCase() === "ADMIN" ? "admin" : "user",
    },
  };
}

export async function register(name: string, email: string, _password: string): Promise<AuthResponse> {
  // Backend CustomerRegisterRequest requires phone + address; callers can
  // pass richer data via registerFull().
  const { data } = await apiClient.post<{
    token: string;
    name: string;
    email: string;
    role: string;
  }>("/auth/register", { name, email, password: _password, phone: "", address: "" });
  return {
    token: data.token,
    user: {
      id: data.email,
      name: data.name,
      email: data.email,
      role: (data.role ?? "").toUpperCase() === "ADMIN" ? "admin" : "user",
    },
  };
}

export type RegisterPayload = {
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
};

export async function registerFull(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<{
    token: string;
    name: string;
    email: string;
    role: string;
  }>("/auth/register", payload);
  return {
    token: data.token,
    user: {
      id: data.email,
      name: data.name,
      email: data.email,
      role: (data.role ?? "").toUpperCase() === "ADMIN" ? "admin" : "user",
    },
  };
}

export async function forgotPassword(email: string): Promise<{ ok: true }> {
  const { data } = await apiClient.post<{ ok: true }>("/auth/forgot-password", { email });
  return data;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}