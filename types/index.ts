/**
 * types/index.ts
 * Semua tipe data TypeScript untuk multi-user payment gateway
 */

/** User account */
export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  apiKey: string;
  webhookUrl?: string;
  createdAt: string;
}

/** Public user (tanpa password) */
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  apiKey: string;
  webhookUrl?: string;
  createdAt: string;
}

/** QRIS Statis milik user */
export interface SavedQris {
  id: string;
  userId: string;
  label: string;
  qrisString: string;
  merchantName: string;
  city: string;
  issuer: string;
  isDefault: boolean;
  createdAt: string;
}

/** Data hasil parse QRIS */
export interface QrisInfo {
  merchantName: string;
  city: string;
  postalCode?: string;
  issuer: string;
  method: "static" | "dynamic";
  category?: string;
  currency: string;
  nmid?: string;
  rawString: string;
}

/** Opsi convert ke dinamis */
export interface ConvertOptions {
  amount: number;
  feeType?: "none" | "fixed" | "percent";
  feeValue?: number;
}

/** Hasil generate QRIS Dinamis */
export interface DynamicQrisResult {
  qrisString: string;
  amount: number;
  totalAmount: number;
  feeAmount: number;
  merchantName: string;
  expiresAt: string;
}

/** Status order */
export type OrderStatus =
  | "pending"
  | "awaiting_payment"
  | "awaiting_confirmation"
  | "paid"
  | "expired"
  | "cancelled";

/** Order / Invoice */
export interface Order {
  id: string;
  userId: string;
  code: string;
  amount: number;
  feeAmount: number;
  totalAmount: number;
  description?: string;
  status: OrderStatus;
  qrisString: string;
  merchantName: string;
  qrisId?: string;
  createdAt: string;
  expiresAt: string;
  paidAt?: string;
  customerNote?: string;
  uniqueCode?: number;
  externalId?: string;
}

/** Security event log entry */
export interface SecurityEvent {
  id: string;
  type:
    | 'BRUTE_FORCE'
    | 'IP_BLOCKED'
    | 'INVALID_WEBHOOK'
    | 'ANOMALY'
    | 'SUSPICIOUS_ORDER'
    | 'UNAUTHORIZED'
    | 'RATE_LIMIT'
    | 'INVALID_SIGNATURE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ip?: string;
  userId?: string;
  details: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

/** Webhook payload */
export interface WebhookPayload {
  event: "payment.received" | "payment.confirmed" | "order.created" | "order.paid";
  orderId?: string;
  orderCode?: string;
  amount: number;
  paidAt?: string;
  reference?: string;
  raw?: any;
}

/** API response standar */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
