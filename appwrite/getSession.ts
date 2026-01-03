"use server"
import { cookies } from "next/headers";
import { decryptData } from "@/utils/decrypt";
import { clientAction } from "./adminOrClient";
import { isAppwriteClient } from "@/lib/types/appwrite";

interface SessionUser {
  id: string;
  email: string;
  name: string;
  emailVerification: boolean;
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const localSession = cookieStore.get("localSession");

    // No session cookie found
    if (!localSession || !localSession.value) {
      return null;
    }

    // Try to decrypt the JWT
    // First try with decoding (for new encoded cookies)
    // If that fails, try without decoding (for old cookies, will likely fail in Edge)
    let payload;
    try {
      const decodedJwt = decodeURIComponent(localSession.value);
      payload = await decryptData(decodedJwt, true); // Silent mode for first attempt
    } catch {
      // If decoding failed, try the raw value (backward compatibility)
      try {
        payload = await decryptData(localSession.value, true); // Silent mode for fallback
      } catch {
        // Both attempts failed - invalid/corrupted cookie
        // Cannot delete cookie during SSR, just return null
        // User will need to log out manually or cookie will expire
        return null;
      }
    }

    if (!payload || !payload.userId) {
      return null;
    }

    // Try to get Appwrite user profile for validation
    try {
      const clientResult = await clientAction();

      // Check if clientAction succeeded
      if (!isAppwriteClient(clientResult)) {
        throw new Error('Client action failed: ' + clientResult.message);
      }

      // Fetch user profile from Appwrite
      const user = await clientResult.account.get();

      // Return user data from Appwrite
      return {
        id: user.$id,
        email: user.email,
        name: user.name,
        emailVerification: user.emailVerification,
      };
    } catch {
      // Appwrite validation failed (expected for OAuth on localhost)
      // Fall back to trusting the JWT payload
      console.log('Using JWT session (Appwrite validation unavailable)');

      return {
        id: payload.userId as string,
        email: (payload.email as string) || 'user@oauth.local',
        name: (payload.name as string) || 'OAuth User',
        emailVerification: true, // OAuth users are pre-verified
      };
    }

  } catch (error: unknown) {
    // Suppress prerendering cookie errors in Next.js 15+
    // Also suppress "guests missing scopes" errors (user simply isn't logged in)
    const isExpectedError =
      (error instanceof Error && error.message?.includes('prerendering')) ||
      (typeof error === 'object' && error !== null && 'digest' in error && typeof error.digest === 'string' && error.digest.includes('HANGING_PROMISE')) ||
      (error instanceof Error && error.message?.includes('guests')) ||
      (error instanceof Error && error.message?.includes('missing scopes')) ||
      (typeof error === 'object' && error !== null && 'code' in error && error.code === 401);

    if (!isExpectedError) {
      console.error('Session verification failed:', error);
    }

    return null;
  }
}
