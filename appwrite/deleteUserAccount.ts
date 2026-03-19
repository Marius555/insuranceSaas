"use server"

import { Client, Users } from "node-appwrite"
import { adminAction, clientAction } from "./adminOrClient"
import { isAppwriteClient } from "@/lib/types/appwrite"
import { DATABASE_ID, COLLECTION_IDS } from "@/lib/env"
import { cookies } from "next/headers"
import { decryptData } from "@/utils/decrypt"

async function getUserIdFromSession(): Promise<string | null> {
  // Primary: Appwrite session cookie
  const sessionClient = await clientAction()
  if (isAppwriteClient(sessionClient)) {
    try {
      const user = await sessionClient.account.get()
      return user.$id
    } catch {
      // fall through to JWT fallback
    }
  }

  // Fallback: localSession JWT (same pattern as getSessionCached)
  const cookieStore = await cookies()
  const localSession = cookieStore.get("localSession")
  if (!localSession?.value) return null

  try {
    let payload
    try {
      payload = await decryptData(decodeURIComponent(localSession.value), true)
    } catch {
      payload = await decryptData(localSession.value, true)
    }
    return (payload?.userId as string) ?? null
  } catch {
    return null
  }
}

export async function deleteUserAccount(): Promise<{ success: boolean; message: string }> {
  try {
    // Get the current user's ID from their session
    const userId = await getUserIdFromSession()
    if (!userId) {
      return { success: false, message: "Not authenticated" }
    }

    // Use admin client for deletions
    const { databases } = await adminAction()

    // Delete user document from the users collection
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTION_IDS.USERS, userId)
    } catch {
      // User document may not exist, continue with auth deletion
    }

    // Delete the Appwrite auth account using Users API (requires admin key)
    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!)

    const users = new Users(adminClient)
    await users.delete(userId)

    // Clear session cookies
    const cookieStore = await cookies()
    cookieStore.delete("appSession")
    cookieStore.delete("localSession")

    return { success: true, message: "Account deleted successfully" }
  } catch (error: unknown) {
    console.error("Failed to delete user account:", error)
    return { success: false, message: "Failed to delete account. Please try again." }
  }
}
