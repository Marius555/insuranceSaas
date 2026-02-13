import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { encryptData } from '@/utils/encrypt';
import { Client, Account, Users } from 'node-appwrite';

export async function GET(request: NextRequest) {
  // Get the actual origin from the request (works with any registered origin)
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const redirectUrl = host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const secret = searchParams.get('secret');

    // Validate OAuth callback parameters
    if (!userId || !secret) {
      console.error('OAuth callback missing userId or secret');
      return NextResponse.redirect(
        new URL('/?error=invalid_callback', redirectUrl)
      );
    }

    // Create admin client with API key
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);

    // Create service instances
    const account = new Account(client);
    const users = new Users(client);

    // Create session using the OAuth userId and secret
    const session = await account.createSession(userId, secret);

    // Get user details for JWT cookie
    const user = await users.get(userId);

    // Set session cookies (7-day expiry)
    const timeToExpire = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const jwt = await encryptData(userId, timeToExpire);

    const cookieStore = await cookies();

    // Set Appwrite session cookie
    cookieStore.set("appSession", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === 'production',
      expires: timeToExpire
    });

    // Set local JWT cookie (encoded to prevent browser issues)
    cookieStore.set("localSession", encodeURIComponent(jwt), {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === 'production',
      expires: timeToExpire,
    });

    // Check for pending plan selection (set from /pricing before OAuth)
    const pendingPlan = cookieStore.get("pending_plan")?.value;

    // Clear the pending_plan cookie
    cookieStore.set("pending_plan", "", { path: "/", maxAge: 0 });

    // Redirect to buy_plan if a plan was selected, otherwise go to landing page
    const destination = pendingPlan
      ? `${redirectUrl}/auth/dashboard/${userId}/buy_plan?plan=${pendingPlan}`
      : `${redirectUrl}/`;

    // Force a full page reload to ensure cookies are read properly
    // Using HTML redirect instead of NextResponse.redirect to prevent client-side navigation
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta http-equiv="refresh" content="0;url=${destination}">
        </head>
        <body>
          <script>window.location.href = '${destination}';</script>
        </body>
      </html>`,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );

  } catch (error) {
    console.error('OAuth callback error:', error);

    // Redirect to landing page with error
    const errorUrl = new URL('/', redirectUrl);
    errorUrl.searchParams.set('error', 'oauth_failed');

    if (error instanceof Error) {
      errorUrl.searchParams.set('details', error.message);
    }

    return NextResponse.redirect(errorUrl);
  }
}
