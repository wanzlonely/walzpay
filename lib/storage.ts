/**
 * lib/storage.ts
 * Penyimpanan order & QRIS pakai Upstash Redis (multi-user)
 * Logika convert QRIS tetap di lib/qris.ts
 */

import { v4 as uuidv4 } from "uuid";
import { getRedis, keys } from "./redis";
import { parseQris } from "./qris";
import type { Order, OrderStatus, SavedQris } from "@/types";

export function generateOrderCode(length = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ========== QRIS STATIS ==========

export async function saveUserQris(params: {
  userId: string;
  label: string;
  qrisString: string;
  isDefault?: boolean;
}): Promise<SavedQris> {
  const redis = getRedis();
  const info = parseQris(params.qrisString);
  const id = uuidv4();

  const qris: SavedQris = {
    id,
    userId: params.userId,
    label: params.label || info.merchantName,
    qrisString: params.qrisString.trim(),
    merchantName: info.merchantName,
    city: info.city,
    issuer: info.issuer,
    isDefault: params.isDefault ?? false,
    createdAt: new Date().toISOString(),
  };

  // Kalau set default, unset yang lain
  if (qris.isDefault) {
    const list = await getUserQrisList(params.userId);
    for (const item of list) {
      if (item.isDefault) {
        item.isDefault = false;
        await redis.set(keys.qris(item.id), item);
      }
    }
  }

  await redis.set(keys.qris(id), qris);
  await redis.lpush(keys.userQrisList(params.userId), id);

  return qris;
}

export async function getUserQrisList(userId: string): Promise<SavedQris[]> {
  const redis = getRedis();
  const ids = await redis.lrange<string>(keys.userQrisList(userId), 0, -1);
  if (!ids || ids.length === 0) return [];

  const result: SavedQris[] = [];
  for (const id of ids) {
    const item = await redis.get<SavedQris>(keys.qris(id));
    if (item) result.push(item);
  }
  return result;
}

export async function getQrisById(id: string): Promise<SavedQris | null> {
  const redis = getRedis();
  return redis.get<SavedQris>(keys.qris(id));
}

export async function getDefaultQris(userId: string): Promise<SavedQris | null> {
  const list = await getUserQrisList(userId);
  return list.find((q) => q.isDefault) || list[0] || null;
}

export async function deleteUserQris(userId: string, qrisId: string): Promise<void> {
  const redis = getRedis();
  const item = await redis.get<SavedQris>(keys.qris(qrisId));
  if (!item || item.userId !== userId) throw new Error("QRIS tidak ditemukan");

  await redis.del(keys.qris(qrisId));
  await redis.lrem(keys.userQrisList(userId), 0, qrisId);
}

export async function setDefaultQris(userId: string, qrisId: string): Promise<void> {
  const redis = getRedis();
  const list = await getUserQrisList(userId);

  for (const item of list) {
    const isTarget = item.id === qrisId;
    if (item.isDefault !== isTarget) {
      item.isDefault = isTarget;
      await redis.set(keys.qris(item.id), item);
    }
  }
}

// ========== ORDERS ==========

export async function createOrder(params: {
  userId: string;
  amount: number;
  feeAmount: number;
  totalAmount: number;
  description?: string;
  qrisString: string;
  merchantName: string;
  expiresAt: string;
  qrisId?: string;
  externalId?: string;
}): Promise<Order> {
  const redis = getRedis();
  const order: Order = {
    id: uuidv4(),
    userId: params.userId,
    code: generateOrderCode(),
    amount: params.amount,
    feeAmount: params.feeAmount,
    totalAmount: params.totalAmount,
    description: params.description,
    status: "pending",
    qrisString: params.qrisString,
    merchantName: params.merchantName,
    qrisId: params.qrisId,
    createdAt: new Date().toISOString(),
    expiresAt: params.expiresAt,
    externalId: params.externalId,
  };

  await redis.set(keys.order(order.id), order);
  await redis.set(keys.orderByCode(order.code), order.id);
  await redis.lpush(keys.userOrders(params.userId), order.id);

  return order;
}

export async function getOrderByCode(code: string): Promise<Order | null> {
  const redis = getRedis();
  const id = await redis.get<string>(keys.orderByCode(code));
  if (!id) return null;
  return redis.get<Order>(keys.order(id));
}

export async function getOrderById(id: string): Promise<Order | null> {
  const redis = getRedis();
  return redis.get<Order>(keys.order(id));
}

export async function getUserOrders(userId: string, limit = 50): Promise<Order[]> {
  const redis = getRedis();
  const ids = await redis.lrange<string[]>(keys.userOrders(userId), 0, limit - 1);
  if (!ids || ids.length === 0) return [];

  const result: Order[] = [];
  for (const id of ids) {
    const order = await redis.get<Order>(keys.order(id));
    if (order) result.push(order);
  }
  return result;
}

export async function updateOrderStatus(
  code: string,
  status: OrderStatus,
  extra?: Partial<Order>
): Promise<Order | null> {
  const redis = getRedis();
  const order = await getOrderByCode(code);
  if (!order) return null;

  const updated: Order = {
    ...order,
    status,
    ...extra,
    ...(status === "paid" ? { paidAt: new Date().toISOString() } : {}),
  };

  await redis.set(keys.order(order.id), updated);
  return updated;
}
