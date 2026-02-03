"use server"

import { getSessionCached } from "@/lib/data/cached-queries";

export async function getSession() {
  return getSessionCached();
}
