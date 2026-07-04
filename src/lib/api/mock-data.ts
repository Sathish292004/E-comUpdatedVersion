// Domain types shared across the client. Backend payloads are normalised
// into this shape in `helpers.ts` / individual `*.ts` API modules. No mock
// data lives here — every runtime value comes from the Spring backend.

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  mrp?: number;
  rating?: number;
  reviews?: number;
  stock?: number;
  images?: string[];
  colors?: string[];
  sizes?: string[];
  tags?: string[];
  description?: string;
  specs?: { label: string; value: string }[];
  isNew?: boolean;
  isBestseller?: boolean;
  flashDeal?: boolean;
  productAvailable?: boolean;
  releaseDate?: string;
  stockQuantity?: number;
};

export type Review = {
  id: number;
  name: string;
  rating: number;
  date: string;
  title?: string;
  body: string;
  verified?: boolean;
};
