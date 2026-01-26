"use server";

import { Client, Account, ID, AppwriteException } from "node-appwrite";

interface AuthResult {
  success: true;
  userId: string;
  secret: string;
}

interface AuthError {
  success: false;
  message: string;
  code?: number;
}

type EmailAuthResult = AuthResult | AuthError;

/**
 * Create a new account with email/password and return session credentials
 */
export async function createEmailAccount(
  email: string,
  password: string,
  name: string
): Promise<EmailAuthResult> {
  try {
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);

    const account = new Account(client);

    // Create the user account
    const user = await account.create(
      ID.unique(),
      email,
      password,
      name
    );

    // Create a session for the new user
    const session = await account.createEmailPasswordSession(email, password);

    return {
      success: true,
      userId: user.$id,
      secret: session.secret,
    };
  } catch (error: unknown) {
    if (error instanceof AppwriteException) {
      // Handle specific Appwrite errors
      if (error.code === 409) {
        return {
          success: false,
          message: "An account with this email already exists",
          code: 409,
        };
      }
      if (error.code === 400) {
        return {
          success: false,
          message: "Invalid email or password format",
          code: 400,
        };
      }
      console.error("Appwrite error:", error.type, error.message);
      return {
        success: false,
        message: error.message || "Failed to create account",
        code: error.code,
      };
    }
    console.error("Email signup error:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
    };
  }
}

/**
 * Login with email/password and return session credentials
 */
export async function loginWithEmail(
  email: string,
  password: string
): Promise<EmailAuthResult> {
  try {
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);

    const account = new Account(client);

    // Create email/password session
    const session = await account.createEmailPasswordSession(email, password);

    return {
      success: true,
      userId: session.userId,
      secret: session.secret,
    };
  } catch (error: unknown) {
    if (error instanceof AppwriteException) {
      // Handle specific Appwrite errors
      if (error.code === 401) {
        return {
          success: false,
          message: "Invalid email or password",
          code: 401,
        };
      }
      if (error.code === 400) {
        return {
          success: false,
          message: "Invalid email or password format",
          code: 400,
        };
      }
      console.error("Appwrite error:", error.type, error.message);
      return {
        success: false,
        message: error.message || "Failed to login",
        code: error.code,
      };
    }
    console.error("Email login error:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
    };
  }
}
