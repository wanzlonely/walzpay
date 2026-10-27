/**
 * lib/auth.ts
 * Auth sederhana: register, login, JWT session, API key
 */

import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { getRedis, keys } from "./redis";
import type { User, PublicUser } from "@/types";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "qris-pro-secret-ganti-ini-di-production"
);

const COOKIE_NAME = "qris_session";

export function toPublicUser(user: User): PublicUser {
  const { passwordHash, ...pub } = user;
  return pub;
}

/** Generate API key */
export function generateApiKey(): string {
  return `qris_${uuidv4().replace(/-/g, "")}`;
}

/** Hash password */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/** Verify password */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Register user baru */
export async function registerUser(
  email: string,
  password: string,
  name: string
): Promise<PublicUser> {
  const redis = getRedis();
  const emailKey = keys.userByEmail(email);

  const existing = await redis.get(emailKey);
  if (existing) throw new Error("Email sudah terdaftar");

  const id = uuidv4();
  const apiKey = generateApiKey();
  const passwordHash = await hashPassword(password);

  const user: User = {
    id,
    email: email.toLowerCase(),
    name,
    passwordHash,
    apiKey,
    createdAt: new Date().toISOString(),
  };

  await redis.set(keys.user(id), user);
  await redis.set(emailKey, id);
  await redis.set(keys.userByApiKey(apiKey), id);

  return toPublicUser(user);
}

/** Login */
export async function loginUser(
  email: string,
  password: string
): Promise<{ user: PublicUser; token: string }> {
  const redis = getRedis();
  const userId = await redis.get<string>(keys.userByEmail(email));
  if (!userId) throw new Error("Email atau password salah");

  const user = await redis.get<User>(keys.user(userId));
  if (!user) throw new Error("Email atau password salah");

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw new Error("Email atau password salah");

  const token = await createToken(user.id);
  return { user: toPublicUser(user), token };
}

/** Buat JWT */
export async function createToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

/** Verify JWT, return userId */
export async function verifyToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return (payload.sub as string) || null;
  } catch {
    return null;
  }
}

/** Ambil user dari token */
export async function getUserFromToken(token: string): Promise<PublicUser | null> {
  try {
    const userId = await verifyToken(token);
    if (!userId) return null;
    const redis = getRedis();
    const user = await redis.get<User>(keys.user(userId));
    if (!user) return null;
    return toPublicUser(user);
  } catch {
    return null;
  }
}

/** Ambil user dari API key */
export async function getUserFromApiKey(apiKey: string): Promise<PublicUser | null> {
  const redis = getRedis();
  const userId = await redis.get<string>(keys.userByApiKey(apiKey));
  if (!userId) return null;
  const user = await redis.get<User>(keys.user(userId));
  if (!user) return null;
  return toPublicUser(user);
}

/** Regenerate API key */
export async function regenerateApiKey(userId: string): Promise<string> {
  const redis = getRedis();
  const user = await redis.get<User>(keys.user(userId));
  if (!user) throw new Error("User tidak ditemukan");

  if (user.apiKey) {
    await redis.del(keys.userByApiKey(user.apiKey));
  }

  const newKey = generateApiKey();
  user.apiKey = newKey;
  await redis.set(keys.user(userId), user);
  await redis.set(keys.userByApiKey(newKey), userId);
  return newKey;
}

/** Update webhook URL */
export async function updateWebhookUrl(userId: string, url: string): Promise<void> {
  const redis = getRedis();
  const user = await redis.get<User>(keys.user(userId));
  if (!user) throw new Error("User tidak ditemukan");
  user.webhookUrl = url || undefined;
  await redis.set(keys.user(userId), user);
}

export { COOKIE_NAME };
