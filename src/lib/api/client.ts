import axios, { AxiosError } from "axios";

// ---------------------------------------------------------------------------
// SK API client
// ---------------------------------------------------------------------------
// Swap VITE_API_URL to your Spring Boot base (e.g. https://api.example.com).
// The client always calls the live backend; there is no mock mode.
// ---------------------------------------------------------------------------

export const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";

export const AUTH_TOKEN_KEY = "auth_token";
export const AUTH_PROVIDER_KEY = "auth_provider";
export type AuthProvider = "local" | "google";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  timeout: 15000,
});

// --- Request interceptor: attach bearer token if present -------------------
apiClient.interceptors.request.use((cfg) => {
  const token = typeof window !== "undefined" ? window.localStorage.getItem(AUTH_TOKEN_KEY) : null;

  console.log("=================================");
  console.log("REQUEST URL:", `${API_BASE_URL}${cfg.url}`);
  console.log("TOKEN:", token);

  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }

  return cfg;
});

export type ApiError = {
  status: number;
  message: string;
  code?: string;
  details?: unknown;
};

function normaliseError(err: AxiosError<{ message?: string; code?: string }>): ApiError {
  if (err.response) {
    return {
      status: err.response.status,
      message: err.response.data?.message || err.message || "Request failed",
      code: err.response.data?.code,
      details: err.response.data,
    };
  }
  if (err.code === "ECONNABORTED") {
    return { status: 0, message: "The request timed out. Please try again.", code: "TIMEOUT" };
  }
  return { status: 0, message: err.message || "Network error", code: "NETWORK" };
}

// --- Response interceptor: normalise errors + handle 401 ------------------
apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const apiErr = normaliseError(error as AxiosError<{ message?: string; code?: string }>);
    if (apiErr.status === 401 && typeof window !== "undefined") {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
      const p = window.location.pathname;
      // Auto-logout: only bounce to login from routes that actually require auth.
      // Public pages must remain viewable when a stored token has expired.
      const isAdminArea = p.startsWith("/admin") && !p.startsWith("/admin/login");
      const isProtected =
        isAdminArea ||
        p.startsWith("/account") ||
        p.startsWith("/checkout") ||
        p.startsWith("/wishlist");
      if (isProtected) {
        window.location.replace(isAdminArea ? "/admin/login" : "/auth/login");
      }
    }
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn("[api]", apiErr.status, apiErr.message);
    }
    return Promise.reject(apiErr);
  },
);
