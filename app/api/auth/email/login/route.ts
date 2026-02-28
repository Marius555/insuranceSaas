import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { encryptData } from '@/utils/encrypt';
import { loginWithEmail } from '@/appwrite/emailAuth';
import { getUserDocument } from '@/appwrite/getUserDocument';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Attempt login
    const result = await loginWithEmail(email, password);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: result.code || 401 }
      );
    }

    // Check if user has completed onboarding (needed for JWT flag)
    const userDoc = await getUserDocument(result.userId);

    // Set session cookies (7-day expiry)
    const timeToExpire = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const jwt = await encryptData(
      { userId: result.userId, onboarding_completed: !!(userDoc?.onboarding_completed) },
      timeToExpire
    );

    const cookieStore = await cookies();

    // Set Appwrite session cookie
    cookieStore.set('appSession', result.secret, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      expires: timeToExpire,
    });

    // Set local JWT cookie (encoded to prevent browser issues)
    cookieStore.set('localSession', encodeURIComponent(jwt), {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      expires: timeToExpire,
    });

    const redirect = userDoc ? `/auth/dashboard/${result.userId}` : '/';

    return NextResponse.json({
      success: true,
      redirect,
    });
  } catch (error) {
    console.error('Email login error:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
