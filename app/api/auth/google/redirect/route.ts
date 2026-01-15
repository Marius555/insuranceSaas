import { adminAction } from '@/appwrite/adminOrClient';
import { OAuthProvider } from 'node-appwrite';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { account } = await adminAction();

    // Get the actual origin from the request
    // This allows OAuth to work from any registered origin (localhost, mobile IP, production)
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const appUrl = host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

    const successUrl = `${appUrl}/api/auth/google/callback`;
    const failureUrl = `${appUrl}/?error=oauth_failed`;

    // Create OAuth2 session with Google
    // Note: The appUrl must be registered in Appwrite Console under OAuth2 settings
    const redirectUrl = await account.createOAuth2Token(
      OAuthProvider.Google,
      successUrl,
      failureUrl
    );

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('OAuth redirect error:', error);
    const fallbackUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(
      new URL('/?error=oauth_redirect_failed', fallbackUrl)
    );
  }
}
