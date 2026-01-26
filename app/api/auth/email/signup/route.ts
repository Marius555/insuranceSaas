import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { encryptData } from '@/utils/encrypt';
import { createEmailAccount } from '@/appwrite/emailAuth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, message: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Attempt signup
    const result = await createEmailAccount(email, password, name);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: result.code || 400 }
      );
    }

    // Set session cookies (7-day expiry)
    const timeToExpire = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const jwt = await encryptData(result.userId, timeToExpire);

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

    // New users always go to home for onboarding
    return NextResponse.json({
      success: true,
      redirect: '/',
    });
  } catch (error) {
    console.error('Email signup error:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
