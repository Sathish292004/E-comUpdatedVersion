# 🛍️ SK Store — E-Com Frontend (Updated)

React/TanStack Start storefront + admin panel for the SK Store e-commerce platform. Talks to the Spring Boot backend for products, cart, wishlist, orders, reviews, and auth.

🔗 **Backend:** [E-com-Updated-Backend](https://github.com/Sathish292004/E-com-Updated-Backend) · 🌐[Live demo](https://sk-store-drab.vercel.app)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![TanStack Start](https://img.shields.io/badge/TanStack%20Start-1.x-FF4154?logo=tanstack&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-package%20manager-000000?logo=bun&logoColor=white)

## 📖 Overview
This is the customer storefront and admin dashboard for SK Store. Customers can browse/search/filter products, manage a cart and wishlist, check out, track orders, and sign in with email/password or Google. Admins get a separate panel for products, categories, orders, customers, reviews, analytics, and store settings.

> ✅ **Status:** Actively developed — 23 routes across storefront + admin already exist. The API client always calls the live backend directly; there's no mock/offline mode.

## 🧰 Tech Stack
| Category | Library |
|---|---|
| ⚛️ Framework | React 19 + TanStack Start (SSR meta-framework) |
| 🧭 Routing | TanStack Router — file-based, in `src/routes` |
| 🔄 Data fetching | TanStack Query + Axios |
| 🎨 Styling / UI | Tailwind CSS 4 + shadcn/ui (`new-york` style) + Radix UI primitives |
| 🖋️ Forms | React Hook Form + Zod |
| ✨ Icons | Lucide React |
| 📊 Charts | Recharts (admin analytics) |
| 🎞️ Animation | Framer Motion |
| 🔔 Toasts / UI bits | Sonner, cmdk, vaul, embla-carousel |
| 🔨 Build tool | Vite 8 + Nitro (via `@lovable.dev/vite-tanstack-config`) |
| 📦 Package manager | Bun (`bun.lock`/`bunfig.toml`) — npm also works |
| 🧹 Tooling | ESLint + Prettier + TypeScript |

## 📁 Project Structure
```
E-comUpdatedVersion/
├── src/
│   ├── routes/                 # File-based routes (TanStack Router)
│   │   ├── index.tsx, shop.tsx, categories.tsx, product.$id.tsx, search.tsx
│   │   ├── cart.tsx, checkout.tsx, wishlist.tsx
│   │   ├── auth.tsx(.login/.register/.forgot), oauth2.success.tsx
│   │   ├── account.tsx(.index/.orders/.orders.$id)
│   │   ├── admin.tsx(.index/.login/.products/.categories/.orders/
│   │   │   .customers/.reviews/.analytics/.settings/.profile)
│   │   └── __root.tsx          # App shell
│   ├── components/
│   │   ├── ui/                  # shadcn/ui primitives
│   │   ├── layout/               # Header, footer, nav, etc.
│   │   └── product/              # Product cards, galleries, etc.
│   ├── lib/
│   │   ├── api/                  # One module per backend resource
│   │   │   (auth, products, categories, cart, wishlist, orders, reviews, addresses, profile, admin)
│   │   └── store/AppContext.tsx  # Global state — auth, wishlist, recently viewed, theme
│   ├── hooks/                    # use-mobile, useWishlist, use-store-settings
│   ├── server.ts / start.ts      # TanStack Start server entry
│   └── styles.css
├── components.json               # shadcn/ui config
├── vite.config.ts
└── package.json
```

## 🚀 Getting Started

### ✅ Prerequisites
- Node.js 20+ (or Bun)
- The [E-com-Updated-Backend](https://github.com/Sathish292004/E-com-Updated-Backend) API running somewhere reachable (local or deployed)

### 🔐 Configuration
| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the Spring Boot backend, e.g. `http://localhost:8080`. Falls back to `/api` (same-origin) if unset. |

```bash
# .env
VITE_API_URL=http://localhost:8080
```

### ▶️ Running Locally
```bash
git clone https://github.com/Sathish292004/E-comUpdatedVersion.git
cd E-comUpdatedVersion

bun install       # or: npm install
bun run dev       # or: npm run dev
```
Vite's dev server runs on **port 5173** by default (already allowed in the backend's CORS config).

### 📦 Build & Preview
```bash
bun run build
bun run preview
```

### 🧹 Lint & Format
```bash
bun run lint
bun run format
```

## 🔑 Authentication
- Email/password and Google OAuth2 are both supported; the backend issues a JWT either way.
- The token is stored in `localStorage` (`auth_token`) and attached to every API call automatically via an Axios interceptor.
- A 401 response auto-clears the token and redirects to `/auth/login` (or `/admin/login` for admin routes) — but only from pages that actually require auth, so public pages stay viewable with an expired token.
- ⚠️ **Known gap:** the backend's Google OAuth2 success handler currently redirects to a different, older Vercel URL rather than this app's live domain — worth double-checking `oauth2.success.tsx` against the backend redirect if Google login seems to "disappear" after sign-in.

## 🗺️ Pages
| Area | Routes |
|---|---|
| Storefront | `/`, `/shop`, `/categories`, `/product/:id`, `/search`, `/cart`, `/checkout`, `/wishlist` |
| Customer auth | `/auth/login`, `/auth/register`, `/auth/forgot`, `/oauth2/success` |
| Account | `/account`, `/account/orders`, `/account/orders/:id` |
| Admin | `/admin`, `/admin/login`, `/admin/products`, `/admin/categories`, `/admin/orders`, `/admin/customers`, `/admin/reviews`, `/admin/analytics`, `/admin/settings`, `/admin/profile` |

## 🗺️ Roadmap
- [x] 🛍️ Full storefront — browse, search, filter, cart, wishlist, checkout
- [x] 🔑 Customer auth — email/password + Google OAuth2
- [x] 🛠️ Admin dashboard — products, categories, orders, customers, reviews, analytics, settings
- [ ] 💳 Real payment gateway at checkout (currently places an order with no payment step)
- [ ] 🧪 Automated tests

## 👨‍💻 Author
**Sathish Kumar B**

🔗 GitHub: [github.com/Sathish292004](https://github.com/Sathish292004)

---
⭐ If you found this useful, consider giving the repo a star!
