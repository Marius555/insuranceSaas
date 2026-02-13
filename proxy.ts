import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function proxy(request: NextRequest) {
  const start = Date.now();
  const requestId = crypto.randomUUID();

  const { pathname } = request.nextUrl;
  const method = request.method;
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';
  const userAgent = request.headers.get('user-agent') ?? '';

  let authenticated = false;
  let userId: string | null = null;

  // Attempt to verify the localSession JWT
  const localSession = request.cookies.get('localSession')?.value;

  if (localSession && process.env.ENCRYPTION_KEY) {
    const secret = new TextEncoder().encode(process.env.ENCRYPTION_KEY);

    // Try URL-decoded first, then raw value (matches lib/data/cached-queries.ts:32-42)
    let payload: { userId?: string } | null = null;
    try {
      const decoded = decodeURIComponent(localSession);
      const result = await jwtVerify(decoded, secret, { algorithms: ['HS256'] });
      payload = result.payload as { userId?: string };
    } catch {
      try {
        const result = await jwtVerify(localSession, secret, { algorithms: ['HS256'] });
        payload = result.payload as { userId?: string };
      } catch {
        payload = null;
      }
    }

    if (payload?.userId) {
      authenticated = true;
      userId = payload.userId;
    }
  }

  // Protect /auth/* routes
  const isAuthRoute = pathname.startsWith('/auth');
  const disableProtection = process.env.DISABLE_PROTECTION === 'true';

  if (isAuthRoute && !authenticated && !disableProtection) {
    const redirectUrl = new URL('/', request.url);
    redirectUrl.searchParams.set('auth', 'required');
    redirectUrl.searchParams.set('returnTo', pathname);

    const durationMs = Date.now() - start;

    // console.log(
    //   JSON.stringify({
    //     type: 'traffic',
    //     requestId,
    //     timestamp: new Date().toISOString(),
    //     method,
    //     path: pathname,
    //     ip,
    //     userAgent,
    //     authenticated,
    //     userId,
    //     durationMs,
    //     action: 'redirect',
    //   })
    // );

    const response = NextResponse.redirect(redirectUrl);
    response.headers.set('X-Request-Id', requestId);
    response.headers.set('X-Response-Time', `${durationMs}ms`);
    return response;
  }

  // Continue to the page
  const response = NextResponse.next();
  const durationMs = Date.now() - start;

  response.headers.set('X-Request-Id', requestId);
  response.headers.set('X-Response-Time', `${durationMs}ms`);

  // console.log(
  //   JSON.stringify({
  //     type: 'traffic',
  //     requestId,
  //     timestamp: new Date().toISOString(),
  //     method,
  //     path: pathname,
  //     ip,
  //     userAgent,
  //     authenticated,
  //     userId,
  //     durationMs,
  //   })
  // );

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$|api/auth|api/logout).*)',
  ],
};
