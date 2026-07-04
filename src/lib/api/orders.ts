import { apiClient } from "./client";

export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Out for delivery"
  | "Delivered"
  | "Cancelled";

export type OrderSummary = {
  id: string;
  date: string;
  status: OrderStatus | string;
  total: number;
  items: number;
};

export type OrderLineItem = {
  productName: string;
  quantity: number;
  totalPrice: number;
};

export type OrderDetail = OrderSummary & {
  customerName: string;
  email: string;
  lineItems: OrderLineItem[];
};

// The Spring backend evolved a few field names over time. Instead of assuming
// one exact DTO shape, tolerate the most common variants so the UI stays
// resilient as long as the underlying data is present.
type BackendOrderItem = Record<string, unknown> & {
  productName?: string;
  quantity?: number | string;
  totalPrice?: number | string;
  price?: number | string;
  subtotal?: number | string;
  product?: { id?: number | string; name?: string; title?: string; price?: number | string };
};

type BackendOrder = Record<string, unknown> & {
  id?: number | string;
  orderId?: number | string;
  customerName?: string;
  customer?: { name?: string; email?: string };
  email?: string;
  status?: string;
  orderDate?: string;
  createdAt?: string;
  date?: string;

  totalAmount?: number | string;
  total?: number | string;

    items?: number;               // ✅ CORRECT
    orderItems?: BackendOrderItem[];
    products?: BackendOrderItem[];
};

const num = (v: unknown) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

function pickItems(o: BackendOrder): BackendOrderItem[] {
    return o.orderItems ?? o.products ?? [];
}

function itemPrice(it: BackendOrderItem): number {
  if (it.totalPrice != null) return num(it.totalPrice);
  if (it.subtotal != null) return num(it.subtotal);
  const unit = num(it.price ?? it.product?.price);
  return unit * num(it.quantity ?? 1);
}

function itemName(it: BackendOrderItem): string {
  return it.productName ?? it.product?.name ?? it.product?.title ?? "Item";
}

function summarise(o: BackendOrder): OrderSummary {
    const lineItems = pickItems(o);

    const total =
        o.totalAmount != null
            ? num(o.totalAmount)
            : o.total != null
                ? num(o.total)
                : lineItems.reduce((s, it) => s + itemPrice(it), 0);

    const qty =
        o.items != null
            ? num(o.items)
            : lineItems.reduce((s, it) => s + num(it.quantity), 0);

    return {
        id: String(o.orderId ?? o.id ?? ""),
        date: String(o.orderDate ?? o.createdAt ?? o.date ?? ""),
        status:
            o.status === "PLACED"
                ? "Pending"
                : o.status === "CONFIRMED"
                    ? "Confirmed"
                    : o.status === "OUT_FOR_DELIVERY"
                        ? "Out for delivery"
                        : o.status === "DELIVERED"
                            ? "Delivered"
                            : o.status === "CANCELLED"
                                ? "Cancelled"
                                : "Pending",
        total,
        items: qty,
    };
}

function toDetail(o: BackendOrder): OrderDetail {
  const base = summarise(o);
  return {
    ...base,
    customerName: o.customerName ?? o.customer?.name ?? "",
    email: o.email ?? o.customer?.email ?? "",
    lineItems: pickItems(o).map((it) => ({
      productName: itemName(it),
      quantity: num(it.quantity),
      totalPrice: itemPrice(it),
    })),
  };
}

function toArray(data: unknown): BackendOrder[] {
  if (Array.isArray(data)) return data as BackendOrder[];
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    for (const key of ["orders", "data", "content", "items", "results", "_embedded"]) {
      if (Array.isArray(d[key])) return d[key] as BackendOrder[];
    }
    // Spring HATEOAS: { _embedded: { orders: [...] } }
    const emb = d._embedded as Record<string, unknown> | undefined;
    if (emb && typeof emb === "object") {
      for (const v of Object.values(emb)) {
        if (Array.isArray(v)) return v as BackendOrder[];
      }
    }
  }
  return [];
}

export const ordersQueryKeys = {
  all: ["orders"] as const,
  admin: ["orders", "admin"] as const,
  mine: ["orders", "mine"] as const,
  detail: (id: string) => ["orders", "detail", id] as const,
};

export async function listOrders(): Promise<OrderSummary[]> {
  console.log("CALLING ADMIN ORDERS");

  const { data } = await apiClient.get("/admin/orders");

  console.log("RAW RESPONSE:", data);

  const orders = toArray(data);

  console.log("AFTER toArray:", orders);

  const mapped = orders.map(summarise);

  console.log("AFTER summarise:", mapped);

  return mapped;
}

export async function getOrder(id: string): Promise<OrderDetail | undefined> {
  const { data } = await apiClient.get("/admin/orders");
  const found = toArray(data).find((o) => String(o.orderId ?? o.id) === String(id));
  return found ? toDetail(found) : undefined;
}

export type CreateOrderPayload = {
  customerName: string;
  email: string;
  items: { productId: string | number; quantity: number }[];
};

export async function createOrder(payload: CreateOrderPayload): Promise<{ id: string }> {
  const body = {
    customerName: payload.customerName,
    email: payload.email,
    items: payload.items.map((it) => ({
      productId: Number(it.productId),
      quantity: it.quantity,
    })),
  };
  const { data } = await apiClient.post<BackendOrder>("/orders/place", body);
  return { id: String(data?.orderId ?? data?.id ?? "") };
}

// ---------------------------------------------------------------------------
// Customer-scoped orders  (JWT identifies the user)
// ---------------------------------------------------------------------------
export async function listMyOrders(): Promise<OrderSummary[]> {
  const { data } = await apiClient.get("/customer/orders");

  console.log("CUSTOMER RAW:", data);

  const orders = toArray(data);

  console.log("CUSTOMER ARRAY:", orders);

  const mapped = orders.map(summarise);

  console.log("CUSTOMER MAPPED:", mapped);

  return mapped;
}

export async function getMyOrder(id: string): Promise<OrderDetail | undefined> {
  // Backend exposes GET /api/customer/orders as the single source of truth.
  // Derive the detail view by locating the order in that list.
  const { data } = await apiClient.get("/customer/orders");
  const found = toArray(data).find((o) => String(o.orderId ?? o.id) === String(id));
  return found ? toDetail(found) : undefined;
}

export async function cancelMyOrder(id: string): Promise<string> {
  const { data } = await apiClient.put<string>(`/customer/orders/${id}/cancel`);
  return data;
}

export async function updateOrderStatus(id: string, status: OrderStatus | string): Promise<void> {
  await apiClient.put(`/orders/${id}/status`, { status });
}
