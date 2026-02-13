"use server"

import { Client, Users } from "node-appwrite"
import { adminAction, clientAction } from "./adminOrClient"
import { isAppwriteClient } from "@/lib/types/appwrite"
import { DATABASE_ID, COLLECTION_IDS } from "@/lib/env"
import { cookies } from "next/headers"

export async function deleteUserAccount(): Promise<{ success: boolean; message: string }> {
  try {
    // Get the current user's ID from their session
    const sessionClient = await clientAction()
    if (!isAppwriteClient(sessionClient)) {
      return { success: false, message: "Not authenticated" }
    }

    const currentUser = await sessionClient.account.get()
    const userId = currentUser.$id

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
