# Migrating SK Store to a standalone React + Vite + npm project

This guide ejects this project from the Lovable platform and runs it as a
standard React + Vite app with **npm**, **React Router DOM**, no Bun, no
TanStack Start, no Lovable plugin.

> Run these steps **on your local machine** after exporting to GitHub.
> Doing them inside the Lovable editor will break the in-app preview.

---

## 1. Export

1. In Lovable: **GitHub → Connect to GitHub**, push the project.
2. Locally:
   ```bash
   git clone <your-repo-url> sk-store && cd sk-store
   ```

## 2. Remove Bun + Lovable-only files

```bash
rm -f bun.lock bunfig.toml AGENTS.md
rm -rf .lovable
rm -f src/lib/lovable-error-reporting.ts
rm -f src/router.tsx src/routeTree.gen.ts src/start.ts
rm -f src/routes/__root.tsx
```

## 3. Replace `package.json`

```jsonc
{
  "name": "sk-store",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^6.26.0",
    "axios": "^1.7.0",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.460.0",
    "sonner": "^1.5.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.6.0",
    "vite": "^7.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0"
  }
}
```

Delete every `@tanstack/*`, `@lovable.dev/*`, and Bun-related entry.

## 4. Replace `vite.config.ts`

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  server: { port: 5173 },
});
```

## 5. Add `index.html` at the repo root

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>SK Store — Premium E-Commerce</title>
    <meta name="description" content="SK Store — premium e-commerce." />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## 6. Create `src/main.tsx`

```tsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { AppProvider } from "@/lib/store/AppContext";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
        <Toaster richColors position="top-right" />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
```

## 7. Create `src/App.tsx` (React Router DOM)

```tsx
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./routes/index";
import Shop from "./routes/shop";
import Cart from "./routes/cart";
import Checkout from "./routes/checkout";
import Wishlist from "./routes/wishlist";
import Search from "./routes/search";
import Categories from "./routes/categories";
import Product from "./routes/product.$id";
import Account from "./routes/account";
import AdminLayout from "./routes/admin";
import AdminLogin from "./routes/admin.login";
import AdminDashboard from "./routes/admin.index";
import AdminProducts from "./routes/admin.products";
import AdminOrders from "./routes/admin.orders";
import AdminCustomers from "./routes/admin.customers";
import AdminCategories from "./routes/admin.categories";
import AdminSettings from "./routes/admin.settings";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/categories" element={<Categories />} />
      <Route path="/search" element={<Search />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/wishlist" element={<Wishlist />} />
      <Route path="/product/:id" element={<Product />} />
      <Route path="/account/*" element={<Account />} />

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
```

## 8. Convert each route file

For every file in `src/routes/`:

1. Delete `export const Route = createFileRoute(...)({...})`.
2. Export the component as `export default`.
3. Swap imports:

| TanStack                                  | React Router DOM                       |
| ----------------------------------------- | --------------------------------------- |
| `import { Link } from "@tanstack/react-router"` | `import { Link } from "react-router-dom"` |
| `<Link to="/x/$id" params={{ id }}>`      | ``<Link to={`/x/${id}`}>``              |
| `useNavigate()` (TanStack)                | `useNavigate()` (RRD)                   |
| `navigate({ to: "/x", replace: true })`   | `navigate("/x", { replace: true })`     |
| `useRouterState({ select: s => s.location.pathname })` | `useLocation().pathname`     |
| `Outlet` from `@tanstack/react-router`    | `Outlet` from `react-router-dom`        |
| `Route.useParams()`                       | `useParams()` from `react-router-dom`   |

The `head: () => ({...})` metadata blocks become static `<title>`/`<meta>` in
`index.html` or `useEffect(() => { document.title = "…" }, [])`.

## 9. Install + run

```bash
npm install
npm run dev
npm run build && npm run preview
```

## 10. Backend wiring

Create `.env`:

```env
VITE_API_URL=http://localhost:8080/api
VITE_USE_MOCK=false
```

`src/lib/api/**` already targets the Spring endpoints:
`/products`, `/product/{id}`, `/product/{id}/image`, `/products/search`,
`/orders`, `/orders/place`.

## 11. Admin login

`/admin/login` ships with temporary creds:

- Email: `sk@admin.com`
- Password: `Sathish@2004`

Swap the credential check in `src/routes/admin.login.tsx` for a call to your
Spring Security `/api/auth/login` endpoint and store the JWT under
`localStorage["auth_token"]`. The Axios interceptor in `src/lib/api/client.ts`
already sends it as `Authorization: Bearer …`.

---

After step 11 the project is a fully independent React + Vite + npm app with
no Lovable / Bun / TanStack runtime dependency.
