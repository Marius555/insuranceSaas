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

    const mode = searchParams.get('mode');
    const theme = searchParams.get('theme');
    const darkClass = theme === 'dark' ? 'dark' : '';
    const popupStyle = `<style>.dark body{background:#0a0a0b;color:#f5f5f5}body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}</style>`;

    // Validate OAuth callback parameters
    if (!userId || !secret) {
      console.error('OAuth callback missing userId or secret');
      if (mode === 'popup') {
        return new NextResponse(
          `<!DOCTYPE html><html class="${darkClass}"><head>${popupStyle}</head><body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'oauth-error', error: 'invalid_callback' }, window.location.origin);
              window.close();
            } else { window.location.href = '/?error=invalid_callback'; }
          </script>
          </body></html>`,
          { status: 200, headers: { 'Content-Type': 'text/html' } }
        );
      }
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

    // Check if this is a popup-mode OAuth flow
    if (mode === 'popup') {
      const error = searchParams.get('error');
      const payload = error
        ? { type: 'oauth-error', error }
        : { type: 'oauth-success', userId, name: user.name, email: user.email };

      return new NextResponse(
        `<!DOCTYPE html><html class="${darkClass}"><head>${popupStyle}</head><body>
        <p>Signing in... This window will close automatically.</p>
        <script>
          if (window.opener) {
            window.opener.postMessage(${JSON.stringify(payload)}, window.location.origin);
            window.close();
          } else {
            window.location.href = '/';
          }
        </script>
        </body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

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

    // Check if popup mode from the URL search params
    const popupMode = request.nextUrl.searchParams.get('mode') === 'popup';

    if (popupMode) {
      const catchTheme = request.nextUrl.searchParams.get('theme');
      const catchDarkClass = catchTheme === 'dark' ? 'dark' : '';
      const catchStyle = `<style>.dark body{background:#0a0a0b;color:#f5f5f5}body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}</style>`;
      return new NextResponse(
        `<!DOCTYPE html><html class="${catchDarkClass}"><head>${catchStyle}</head><body>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'oauth-error', error: 'oauth_failed' }, window.location.origin);
            window.close();
          } else { window.location.href = '/?error=oauth_failed'; }
        </script>
        </body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Redirect to landing page with error
    const errorUrl = new URL('/', redirectUrl);
    errorUrl.searchParams.set('error', 'oauth_failed');

    if (error instanceof Error) {
      errorUrl.searchParams.set('details', error.message);
    }

    return NextResponse.redirect(errorUrl);
  }
}
