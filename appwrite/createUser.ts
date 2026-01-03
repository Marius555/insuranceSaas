"use server";

import { adminAction } from "./adminOrClient";
import { cookies } from "next/headers";
import { ID, Permission, Role } from "node-appwrite";
import { encryptData } from "@/utils/encrypt";



export async function createUser(data: {
  email: string;
  password: string;
  role?: 'facility_admin' | 'specialist';
}) {
  try {
    const email = data.email?.trim();
    const password = data.password;
    const role = data.role || 'facility_admin'; // Default to facility_admin for backward compatibility

    const name = email.split("@");

    const { account, databases } = await adminAction();

    const userId = ID.unique();
    await account.create(userId, email, password, name[0]);
    const session = await account.createEmailPasswordSession(email, password);
    const cookieStore = await cookies();

    const timeToExpire = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const user = session.userId;

    // Create user document in users collection
    const databaseId = process.env.DATABASE_ID!;
    const usersCollectionId = process.env.USERS_COLLECTION_ID!;

    await databases.createDocument(
      databaseId,
      usersCollectionId,
      userId,
      {
        full_name: name[0],
        email: email,
        role: role,
        onboarding_completed: false,
      },
      [
        Permission.read(Role.user(userId)),
        Permission.update(Role.user(userId)),
      ]
    );

    const jwt = await encryptData(user, timeToExpire);
    // Set appSession cookie
    cookieStore.set("appSession", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === 'production',
      expires: timeToExpire
    });

    // Encode JWT to prevent browser-specific encoding issues (especially Edge)
    cookieStore.set("localSession", encodeURIComponent(jwt), {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === 'production',
      expires: timeToExpire,
    });

    return { success: true, message: "User Created Successfully", userId: user };
  } catch (error) {

    // Sanitize error messages - don't expose internal details
    if (error instanceof Error && (error.message?.includes("user_already_exists") || error.message?.includes("already exists"))) {
      return { success: false, message: "An account with this email already exists" };
    }

    return { success: false, message: "Failed to create account. Please try again." };
  }
}
