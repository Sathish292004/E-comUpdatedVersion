import { apiClient } from "./client";

export type AdminDashboard = {
  totalProducts: number;
  totalCategories: number;
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
};

export type AdminLoginResponse = {
  token: string;
  role: string;
  name: string;
};

export type AdminCustomer = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  role?: string | null;

  orders: number;
  spent: number;
  since: string | null;
};

export type AdminReview = {
  id: number;
  customerName: string;
  customerEmail?: string | null;
  productId: number;
  productName: string;
  rating: number;
  comment: string;
  reviewDate: string;
};

type RawRecord = Record<string, unknown>;

const asRecord = (value: unknown): RawRecord | undefined =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RawRecord) : undefined;

const asString = (value: unknown): string | undefined => {
  if (value == null) return undefined;
  return String(value);
};

const asNumber = (value: unknown): number => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

function toArray<T = RawRecord>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];

  const root = asRecord(data);
  if (!root) return [];

  for (const key of ["content", "data", "items", "results", "customers", "reviews"]) {
    if (Array.isArray(root[key])) return root[key] as T[];
  }

  const embedded = asRecord(root._embedded);

  if (embedded) {
    for (const value of Object.values(embedded)) {
      if (Array.isArray(value)) return value as T[];
    }
  }

  return [];
}

function personName(source: RawRecord, fallback: string): string {
  const nestedUser = asRecord(source.user) ?? asRecord(source.customer);

  const first = asString(source.firstName ?? nestedUser?.firstName);
  const last = asString(source.lastName ?? nestedUser?.lastName);

  const directName = asString(
    source.name ?? source.customerName ?? source.fullName ?? nestedUser?.name,
  );

  const combinedName = [first, last].filter(Boolean).join(" ");

  return directName || combinedName || fallback;
}

function addressText(value: unknown): string | null {
  if (value == null) return null;

  if (typeof value !== "object") return String(value);

  const address = value as RawRecord;

  return (
    [address.line1, address.line2, address.city, address.state, address.pincode ?? address.zip]
      .map(asString)
      .filter(Boolean)
      .join(", ") || null
  );
}

function normaliseCustomer(raw: RawRecord): AdminCustomer {
  const nestedUser = asRecord(raw.user) ?? asRecord(raw.customer);

  const id = asNumber(raw.id ?? raw.customerId ?? raw.userId ?? nestedUser?.id);

  const email = asString(raw.email ?? nestedUser?.email) ?? "";

  return {
    id,

    name: personName(raw, email || `Customer ${id}`),

    email,

    phone: asString(raw.phone ?? raw.phoneNumber ?? raw.mobile ?? nestedUser?.phone) ?? null,

    address: addressText(raw.address ?? raw.shippingAddress ?? raw.defaultAddress),

    role: asString(raw.role) ?? "CUSTOMER",

    orders: asNumber(raw.orders),

    spent: asNumber(raw.spent),

    since: asString(raw.since) ?? null,
  };
}

function normaliseReview(raw: RawRecord): AdminReview {
  const product = asRecord(raw.product);

  const id = asNumber(raw.id ?? raw.reviewId);

  return {
    id,

    customerName: personName(raw, asString(raw.customerEmail) ?? "Customer"),

    customerEmail:
      asString(raw.customerEmail ?? asRecord(raw.customer)?.email ?? asRecord(raw.user)?.email) ??
      null,

    productId: asNumber(raw.productId ?? product?.id),

    productName:
      asString(raw.productName ?? raw.productTitle ?? product?.name ?? product?.title) ?? "Product",

    rating: asNumber(raw.rating ?? raw.stars),

    comment: asString(raw.comment ?? raw.review ?? raw.text ?? raw.message) ?? "",

    reviewDate: asString(raw.reviewDate ?? raw.createdAt ?? raw.date) ?? "",
  };
}

export const adminApi = {
  login: (email: string, password: string) =>
    apiClient
      .post<AdminLoginResponse>("/admin/login", {
        email,
        password,
      })
      .then((r) => r.data),

  dashboard: () => apiClient.get<AdminDashboard>("/admin/dashboard").then((r) => r.data),

  customers: {
    list: () =>
      apiClient
        .get<unknown>("/admin/customers")
        .then((r) => toArray(r.data).map(normaliseCustomer)),

    get: (id: number) =>
      apiClient
        .get<unknown>(`/admin/customers/${id}`)
        .then((r) => normaliseCustomer(asRecord(r.data) ?? {})),
  },

  reviews: {
    list: () =>
      apiClient.get<unknown>("/admin/reviews").then((r) => toArray(r.data).map(normaliseReview)),

    remove: (id: number) => apiClient.delete<void>(`/admin/reviews/${id}`).then((r) => r.data),
  },
};
