import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Product } from "@/lib/api/mock-data";
import { profileApi } from "@/lib/api/profile";
import { AUTH_TOKEN_KEY, AUTH_PROVIDER_KEY } from "@/lib/api/client";
import {
  addCartItem,
  cartQueryKeys,
  clearCartApi,
  getCart,
  removeCartItem,
  updateCartItem,
  type CartSnapshot,
} from "@/lib/api/cart";

export type CartItem = { product: Product; qty: number; size?: string; color?: string };
export type User = { id: string; name: string; email: string; role: "user" | "admin" } | null;

type State = {
  wishlist: Product[];
  recently: Product[];
  compare: Product[];
  user: User;
  theme: "light" | "dark";
  authReady: boolean;
};

type Action =
  | { type: "TOGGLE_WISH"; product: Product }
  | { type: "ADD_RECENT"; product: Product }
  | { type: "TOGGLE_COMPARE"; product: Product }
  | { type: "LOGIN"; user: User }
  | { type: "LOGOUT" }
  | { type: "THEME"; theme: "light" | "dark" }
  | { type: "HYDRATE"; state: Partial<State> };

const initial: State = {
  wishlist: [],
  recently: [],
  compare: [],
  user: null,
  theme: "light",
  authReady: false,
};

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "TOGGLE_WISH": {
      const exists = s.wishlist.find((p) => p.id === a.product.id);
      return {
        ...s,
        wishlist: exists
          ? s.wishlist.filter((p) => p.id !== a.product.id)
          : [a.product, ...s.wishlist],
      };
    }
    case "ADD_RECENT": {
      const rest = s.recently.filter((p) => p.id !== a.product.id);
      return { ...s, recently: [a.product, ...rest].slice(0, 8) };
    }
    case "TOGGLE_COMPARE": {
      const exists = s.compare.find((p) => p.id === a.product.id);
      if (exists) return { ...s, compare: s.compare.filter((p) => p.id !== a.product.id) };
      return { ...s, compare: [...s.compare, a.product].slice(0, 4) };
    }
    case "LOGIN":
      return { ...s, user: a.user, authReady: true };
    case "LOGOUT":
      return { ...s, user: null, authReady: true };
    case "THEME":
      return { ...s, theme: a.theme };
    case "HYDRATE":
      return { ...s, ...a.state };
    default:
      return s;
  }
}

type Ctx = State & {
  cart: CartItem[];
  addToCart: (p: Product, opts?: { qty?: number; size?: string; color?: string }) => void;
  removeFromCart: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clearCart: () => void;
  toggleWish: (p: Product) => void;
  isWished: (id: string) => boolean;
  addRecent: (p: Product) => void;
  toggleCompare: (p: Product) => void;
  login: (u: NonNullable<User>) => void;
  logout: () => void;
  setTheme: (t: "light" | "dark") => void;
  subtotal: number;
  cartCount: number;
};

const AppCtx = createContext<Ctx | null>(null);

const STORAGE_KEY = "ecom_state_v1";

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const queryClient = useQueryClient();

  // Backend cart is the single source of truth. Only fetch when signed in.
  const cartQuery = useQuery<CartSnapshot>({
    queryKey: cartQueryKeys.all,
    queryFn: getCart,
    enabled: !!state.user,
    staleTime: 0,
  });

  const invalidateCart = () => queryClient.invalidateQueries({ queryKey: cartQueryKeys.all });

  const addMut = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string | number; quantity: number }) =>
      addCartItem(productId, quantity),
    onSuccess: invalidateCart,
  });
  const updateMut = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string | number; quantity: number }) =>
      updateCartItem(productId, quantity),
    onSuccess: invalidateCart,
  });
  const removeMut = useMutation({
    mutationFn: (productId: string | number) => removeCartItem(productId),
    onSuccess: invalidateCart,
  });
  const clearMut = useMutation({
    mutationFn: () => clearCartApi(),
    onSuccess: invalidateCart,
  });

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<State>;
        // SECURITY: never trust security-sensitive fields from localStorage.
        // The persisted `user` (including `role` and `id`) is dropped on hydrate
        // to prevent privilege escalation via DevTools storage tampering.
        // Roles must always come from a verified server-side session.
        const { user: _ignored, authReady: _ar, ...safe } = parsed;
        // Never restore a cart from localStorage — the backend owns it.
        const { ...safeNoCart } = safe as any;
        delete (safeNoCart as any).cart;
        dispatch({ type: "HYDRATE", state: safeNoCart });
      }
    } catch {}
  }, []);

  // Restore auth session from stored JWT on startup by revalidating with the backend.
  useEffect(() => {
    let cancelled = false;

    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    if (!token) {
      dispatch({ type: "HYDRATE", state: { authReady: true } });
      return;
    }

    const admin = sessionStorage.getItem("sk_admin_session_v1");

    if (admin) {
      const a = JSON.parse(admin);

      dispatch({
        type: "LOGIN",
        user: {
          id: a.email,
          name: a.name,
          email: a.email,
          role: "admin",
        },
      });

      dispatch({ type: "HYDRATE", state: { authReady: true } });

      return;
    }

    (async () => {
      try {
        const p = await profileApi.get();

        if (cancelled) return;

        dispatch({
          type: "LOGIN",
          user: {
            id: p.email,
            name: p.name,
            email: p.email,
            role: "user",
          },
        });

        dispatch({ type: "HYDRATE", state: { authReady: true } });
      } catch {
        if (cancelled) return;

        localStorage.removeItem(AUTH_TOKEN_KEY);

        dispatch({
          type: "HYDRATE",
          state: { authReady: true },
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Persist only non-sensitive state. `user` is intentionally excluded so
    // that role/id cannot be tampered with via localStorage.
    const { user: _u, authReady: _ar, ...persisted } = state;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    document.documentElement.classList.toggle("dark", state.theme === "dark");
  }, [state]);

  const cart = cartQuery.data?.items ?? [];
  const cartCount = cartQuery.data?.totalItems ?? 0;
  const subtotal = cartQuery.data?.totalAmount ?? 0;

  const value = useMemo<Ctx>(() => {
    return {
      ...state,
      cart,
      subtotal,
      cartCount,
      addToCart: (product, opts) => {
        if (!state.user) {
          // Not authenticated → cannot add to backend cart.

          console.warn("[cart] add ignored: user not authenticated");
          return;
        }
        addMut.mutate({ productId: product.id, quantity: opts?.qty ?? 1 });
      },
      removeFromCart: (id) => {
        if (state.user) removeMut.mutate(id);
      },
      setQty: (id, qty) => {
        if (state.user) updateMut.mutate({ productId: id, quantity: Math.max(1, qty) });
      },
      clearCart: () => {
        if (state.user) clearMut.mutate();
      },
      toggleWish: (p) => dispatch({ type: "TOGGLE_WISH", product: p }),
      isWished: (id) => state.wishlist.some((p) => p.id === id),
      addRecent: (p) => dispatch({ type: "ADD_RECENT", product: p }),
      toggleCompare: (p) => dispatch({ type: "TOGGLE_COMPARE", product: p }),
      login: (u) => {
        dispatch({ type: "LOGIN", user: u });
        try {
          queryClient.invalidateQueries({ queryKey: ["orders"] });
          queryClient.invalidateQueries({ queryKey: ["wishlist"] });
          queryClient.invalidateQueries({ queryKey: ["profile"] });
          queryClient.invalidateQueries({ queryKey: ["addresses"] });
          queryClient.invalidateQueries({ queryKey: ["cart"] });
          queryClient.invalidateQueries({ queryKey: ["admin"] });
        } catch { /* empty */ }
      },
      logout: () => {
        try {
          window.localStorage.removeItem("auth_token");
          window.localStorage.removeItem(AUTH_PROVIDER_KEY);
          sessionStorage.removeItem("sk_admin_session_v1");
        } catch { /* empty */ }
        // Drop any cached user data (profile, orders, wishlist, addresses, …)
        // so a subsequent sign-in never displays the previous user's info.
        try {
          queryClient.cancelQueries();
          queryClient.clear();
        } catch { /* empty */ }
        dispatch({ type: "LOGOUT" });
      },
      setTheme: (t) => dispatch({ type: "THEME", theme: t }),
    };
  }, [state, queryClient, cart, cartCount, subtotal, addMut, updateMut, removeMut, clearMut]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
