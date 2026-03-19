"use server";

import { cookies } from "next/headers";
import { encryptData } from "@/utils/encrypt";
import { decryptData } from "@/utils/decrypt";

const ADMIN_EMAIL = "wanmariusmz@gmail.com";
const ADMIN_PASSWORD = "532160";

export async function validateCredentials(email: string, password: string): Promise<boolean> {
  return email === ADMIN_EMAIL && password === ADMIN_PASSWORD;
}

export async function createAdminSession(): Promise<void> {
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  const token = await encryptData({ role: "admin" }, expiry);
  const cookieStore = await cookies();
  cookieStore.set("adminSession", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiry,
  });
}

export async function validateAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("adminSession");
    if (!session?.value) return false;

    const payload = await decryptData(session.value, true);
    return payload?.role === "admin";
  } catch {
    return false;
  }
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("adminSession");
}
