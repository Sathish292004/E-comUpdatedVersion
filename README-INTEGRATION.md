# Connecting SK Frontend to your Spring Boot backend

This frontend is 100% client-side. All data flows through a thin Axios
service layer in `src/lib/api/`. To replace the mock data with your real
Spring Boot REST API you only need to change **environment variables** —
no component code has to be touched.

## 1. Environment variables

Create a `.env.local` file at the project root:

```env
VITE_API_URL=https://api.your-domain.com
VITE_USE_MOCK=false
```

| Variable        | Purpose                                                 |
| --------------- | ------------------------------------------------------- |
| `VITE_API_URL`  | Base URL of your Spring Boot REST API                   |
| `VITE_USE_MOCK` | `true` → return mock JSON, `false` → call the real API |

During local development you can keep `VITE_USE_MOCK=true` to work without
a backend running.

## 2. Expected REST endpoints

The frontend services already issue these requests when `VITE_USE_MOCK=false`.
Implement the matching controllers in Spring Boot:

### Products & catalogue

| Method | Path                       | Used by                        |
| ------ | -------------------------- | ------------------------------ |
| GET    | `/products`                | `listProducts`                 |
| GET    | `/products/{id}`           | `getProduct`                   |
| GET    | `/products/search?q=...`   | `searchProducts`               |
| GET    | `/categories`              | `listCategories` (optional)    |

### Auth (mock-friendly)

| Method | Path                    | Body                                  |
| ------ | ----------------------- | ------------------------------------- |
| POST   | `/auth/login`           | `{ email, password }`                 |
| POST   | `/auth/register`        | `{ name, email, password }`           |
| POST   | `/auth/forgot-password` | `{ email }`                           |
| POST   | `/auth/logout`          | _empty_                               |

Each successful auth response should return `{ user, token }`. The token is
stored under `localStorage["auth_token"]` and automatically attached to every
subsequent request as `Authorization: Bearer <token>`.

### Orders

| Method | Path             | Used by        |
| ------ | ---------------- | -------------- |
| GET    | `/orders`        | `listOrders`   |
| GET    | `/orders/{id}`   | `getOrder`     |
| POST   | `/orders`        | `createOrder`  |

## 3. CORS

Allow the frontend origin from Spring Boot:

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
  @Override public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/**")
      .allowedOrigins("https://your-frontend.example.com", "http://localhost:5173")
      .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
      .allowedHeaders("*")
      .allowCredentials(true);
  }
}
```

## 4. Error contract

The Axios response interceptor normalises every error into:

```ts
type ApiError = { status: number; message: string; code?: string; details?: unknown };
```

So your Spring Boot error responses should ideally look like:

```json
{ "message": "Email already in use", "code": "EMAIL_TAKEN" }
```

## 5. Verifying the switch

1. Set `VITE_USE_MOCK=false` and restart the dev server.
2. Open the network panel — every product/order/auth call should hit your
   Spring Boot host instead of returning mock data.
3. No component or route file needs to change.

That's it — the frontend is ready for production.