"use server";

import { validateCredentials, createAdminSession, clearAdminSession } from "./auth";

export async function loginAdmin(
  email: string,
  password: string
): Promise<{ success: boolean; message: string }> {
  if (!(await validateCredentials(email, password))) {
    return { success: false, message: "Invalid credentials" };
  }

  await createAdminSession();
  return { success: true, message: "Logged in" };
}

export async function logoutAdmin(): Promise<{ success: boolean }> {
  await clearAdminSession();
  return { success: true };
}
