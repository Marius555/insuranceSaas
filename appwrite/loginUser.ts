"use server";
import { adminAction } from "./adminOrClient";
import { cookies } from "next/headers";
import { encryptData } from "@/utils/encrypt";

interface LoginData {
  email?: string;
  password?: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  userId?: string;
}

// Input validation functions

export async function loginUser(data: LoginData): Promise<LoginResponse> {
  try {
    const email = data.email?.trim();
    const password = data.password;


    const { account } = await adminAction();

    const session = await account.createEmailPasswordSession(email as string, password as string);
    const timeToExpire = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const user = session.userId;

    const jwt = await encryptData(user, timeToExpire);
    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === 'production';

    // Debug logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log('Login: Setting cookies', {
        userId: user,
        expiresAt: timeToExpire,
        isSecure: isProduction
      });
    }

    cookieStore.set("appSession", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: isProduction,
      expires: timeToExpire,
    });

    // Encode JWT to prevent browser-specific encoding issues (especially Edge)
    cookieStore.set("localSession", encodeURIComponent(jwt), {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: isProduction,
      expires: timeToExpire,
    });

    return { success: true, message: "Login successful", userId: user };
  } catch (error) {

    // Sanitize error messages - don't expose internal details
    if (error instanceof Error && (error.message?.includes("invalid_credentials") || error.message?.includes("Invalid credentials"))) {
      return { success: false, message: "Invalid email or password" };
    }

    if (error instanceof Error && (error.message?.includes("user_not_found") || error.message?.includes("not found"))) {
      return { success: false, message: "Invalid email or password" };
    }

    return { success: false, message: "Login failed. Please try again." };
  }
}
