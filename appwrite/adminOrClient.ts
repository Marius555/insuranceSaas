"use server"
import { Client, Account, Databases, Storage } from "node-appwrite";
import { cookies } from "next/headers";
import type { AppwriteClient, ErrorResult } from "@/lib/types/appwrite";

/**
 * Initialize Appwrite client with user session
 * Returns AppwriteClient on success or ErrorResult on failure
 *
 * @returns Promise<AppwriteClient | ErrorResult>
 */
export async function clientAction(): Promise<AppwriteClient | ErrorResult> {
  try {
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

    const cookieStore = await cookies();
    const session = cookieStore.get("appSession");

    if (!session || !session.value) {
      return { success: false, message: "Failed to load session" };
    }

    client.setSession(session.value);

    return {
      account: new Account(client),
      databases: new Databases(client),
      storage: new Storage(client),
    };
  } catch (error) {
    console.error('❌ Client action initialization failed:', error);
    return { success: false, message: "Failed to initialize client" };
  }
}

/**
 * Initialize Appwrite client with admin API key
 * Always returns AppwriteClient (throws on failure)
 *
 * @returns Promise<AppwriteClient>
 */
export async function adminAction(): Promise<AppwriteClient> {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

  return {
    account: new Account(client),
    databases: new Databases(client),
    storage: new Storage(client),
  };
}