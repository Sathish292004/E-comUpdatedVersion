import { apiClient } from "./client";

export type Review = {
  id: number;
  customerName: string;
  productName: string;
  rating: number;
  comment: string;
  reviewDate: string;
};

export type ProductReviews = {
  productId: number;
  productName: string;
  averageRating: number | null;
  totalReviews: number;
  reviews: Review[];
};

export type ReviewInput = { rating: number; comment: string };

export const reviewsApi = {
  listForProduct: (productId: number | string) =>
    apiClient
      .get<ProductReviews>(`/products/${productId}/reviews`)
      .then((r) => r.data),
  add: (productId: number | string, body: ReviewInput) =>
    apiClient
      .post<Review>(`/customer/products/${productId}/reviews`, body)
      .then((r) => r.data),
  update: (reviewId: number, body: ReviewInput) =>
    apiClient
      .put<Review>(`/customer/reviews/${reviewId}`, body)
      .then((r) => r.data),
  remove: (reviewId: number) =>
    apiClient.delete<string>(`/customer/reviews/${reviewId}`).then((r) => r.data),
};