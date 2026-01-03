import { SignJWT } from "jose";

type UserData = string | Record<string, unknown>;

export async function encryptData(userData: UserData, timeToExpire: Date): Promise<string> {
  try {
    if (!process.env.ENCRYPTION_KEY) {
      throw new Error("ENCRYPTION_KEY environment variable is required");
    }

    // Use direct key (Edge Runtime compatible)
    const secret = new TextEncoder().encode(process.env.ENCRYPTION_KEY);

    // Handle both string (just userId) and object (userId, email, name) formats
    const payload = typeof userData === 'string'
      ? { userId: userData }
      : userData;

    const jwt = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(timeToExpire)
      .sign(secret);

    return jwt;
  } catch {
    throw new Error("Failed to encrypt user data");
  }
}
